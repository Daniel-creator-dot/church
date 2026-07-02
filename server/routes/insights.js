import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [
      monthlyGiving,
      lastMonthGiving,
      visitorFunnel,
      pendingPrayers,
      pendingFollowUps,
      newVisitors,
      volunteerGaps,
      attendanceTrend,
      atRiskMembers,
      upcomingBirthdays,
      groupStats,
      engagementLeaders,
    ] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM donations WHERE donation_date >= $1`,
        [monthStart]
      ),
      pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM donations WHERE donation_date >= $1 AND donation_date <= $2`,
        [lastMonthStart, lastMonthEnd]
      ),
      pool.query(
        `SELECT status, COUNT(*)::int as count FROM visitors GROUP BY status ORDER BY count DESC`
      ),
      pool.query(`SELECT COUNT(*)::int as count FROM prayer_requests WHERE status = 'Pending'`),
      pool.query(`SELECT COUNT(*)::int as count FROM follow_ups WHERE status IN ('Pending', 'In Progress')`),
      pool.query(`SELECT COUNT(*)::int as count FROM visitors WHERE status = 'New'`),
      pool.query(
        `SELECT va.assignment_date, vr.name as role_name, COUNT(*)::int as assigned
         FROM volunteer_assignments va
         LEFT JOIN volunteer_roles vr ON va.role_id = vr.id
         WHERE va.assignment_date BETWEEN CURRENT_DATE AND $1::date
         GROUP BY va.assignment_date, vr.name
         ORDER BY va.assignment_date`,
        [sevenDaysOut]
      ),
      pool.query(
        `SELECT service_date as date, service_type, headcount FROM attendance_records
         ORDER BY service_date DESC LIMIT 8`
      ),
      pool.query(
        `SELECT m.id, m.first_name, m.last_name, m.email, m.phone
         FROM members m
         WHERE LOWER(m.status) = 'active'
         AND m.id::text NOT IN (
           SELECT DISTINCT unnest(attended_member_ids)
           FROM attendance_records
           WHERE service_date >= $1 AND attended_member_ids IS NOT NULL AND array_length(attended_member_ids, 1) > 0
         )
         ORDER BY m.last_name, m.first_name
         LIMIT 15`,
        [fourWeeksAgo]
      ),
      pool.query(
        `SELECT id, first_name, last_name, date_of_birth
         FROM members
         WHERE date_of_birth IS NOT NULL AND LOWER(status) = 'active'
         ORDER BY
           CASE WHEN
             MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::int,
               EXTRACT(MONTH FROM date_of_birth)::int,
               EXTRACT(DAY FROM date_of_birth)::int) >= CURRENT_DATE
           THEN MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::int,
               EXTRACT(MONTH FROM date_of_birth)::int,
               EXTRACT(DAY FROM date_of_birth)::int)
           ELSE MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::int + 1,
               EXTRACT(MONTH FROM date_of_birth)::int,
               EXTRACT(DAY FROM date_of_birth)::int)
           END
         LIMIT 8`
      ),
      pool.query(
        `SELECT COUNT(*)::int as total_groups,
         (SELECT COUNT(*)::int FROM group_members) as total_members
         FROM small_groups WHERE is_active = true`
      ),
      pool.query(
        `SELECT m.id, m.first_name, m.last_name,
           (SELECT COUNT(*) FROM event_checkins ec WHERE ec.member_id = m.id) as checkins,
           (SELECT COUNT(*) FROM donations d WHERE d.member_id = m.id AND d.donation_date >= $1) as recent_giving
         FROM members m
         WHERE LOWER(m.status) = 'active'
         ORDER BY checkins DESC, recent_giving DESC
         LIMIT 5`,
        [fourWeeksAgo]
      ),
    ]);

    const monthTotal = parseFloat(monthlyGiving.rows[0]?.total || 0);
    const lastMonthTotal = parseFloat(lastMonthGiving.rows[0]?.total || 0);
    const givingChange = lastMonthTotal > 0
      ? Math.round(((monthTotal - lastMonthTotal) / lastMonthTotal) * 100)
      : monthTotal > 0 ? 100 : 0;

    const actionItems = [
      { type: 'prayer', label: 'Pending prayer requests', count: pendingPrayers.rows[0]?.count || 0, tab: 'Prayer Requests' },
      { type: 'followup', label: 'Open follow-up tasks', count: pendingFollowUps.rows[0]?.count || 0, tab: 'Follow Up' },
      { type: 'visitor', label: 'New visitors to contact', count: newVisitors.rows[0]?.count || 0, tab: 'Visitors' },
      { type: 'atrisk', label: 'Members absent 4+ weeks', count: atRiskMembers.rows.length, tab: 'Members' },
    ].filter(a => a.count > 0);

    res.json({
      monthlyGiving: monthTotal,
      lastMonthGiving: lastMonthTotal,
      givingChangePercent: givingChange,
      visitorFunnel: visitorFunnel.rows,
      actionItems,
      volunteerSchedule: volunteerGaps.rows,
      attendanceTrend: attendanceTrend.rows.reverse().map(r => ({
        date: r.date,
        serviceType: r.service_type,
        headcount: r.headcount,
      })),
      atRiskMembers: atRiskMembers.rows.map(m => ({
        id: m.id,
        name: `${m.first_name} ${m.last_name}`.trim(),
        email: m.email,
        phone: m.phone,
      })),
      upcomingBirthdays: upcomingBirthdays.rows.map(m => ({
        id: m.id,
        name: `${m.first_name} ${m.last_name}`.trim(),
        birthday: m.date_of_birth,
      })),
      smallGroups: groupStats.rows[0] || { total_groups: 0, total_members: 0 },
      topEngaged: engagementLeaders.rows.map(m => ({
        id: m.id,
        name: `${m.first_name} ${m.last_name}`.trim(),
        checkins: parseInt(m.checkins, 10),
        recentGiving: parseInt(m.recent_giving, 10),
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
