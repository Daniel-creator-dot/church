import pool from '../db.js';

export async function getDashboardInsights() {
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
    pool.query(`SELECT COALESCE(SUM(amount), 0) as total FROM donations WHERE donation_date >= $1`, [monthStart]),
    pool.query(`SELECT COALESCE(SUM(amount), 0) as total FROM donations WHERE donation_date >= $1 AND donation_date <= $2`, [lastMonthStart, lastMonthEnd]),
    pool.query(`SELECT status, COUNT(*)::int as count FROM visitors GROUP BY status ORDER BY count DESC`),
    pool.query(`SELECT COUNT(*)::int as count FROM prayer_requests WHERE status = 'Pending'`),
    pool.query(`SELECT COUNT(*)::int as count FROM follow_ups WHERE status IN ('Pending', 'In Progress')`),
    pool.query(`SELECT COUNT(*)::int as count FROM visitors WHERE status = 'New'`),
    pool.query(
      `SELECT va.assignment_date, vr.name as role_name, COUNT(*)::int as assigned
       FROM volunteer_assignments va
       LEFT JOIN volunteer_roles vr ON va.role_id = vr.id
       WHERE va.assignment_date BETWEEN CURRENT_DATE AND $1::date
       GROUP BY va.assignment_date, vr.name ORDER BY va.assignment_date`,
      [sevenDaysOut]
    ),
    pool.query(`SELECT service_date as date, service_type, headcount FROM attendance_records ORDER BY service_date DESC LIMIT 8`),
    pool.query(
      `SELECT m.id, m.first_name, m.last_name, m.email, m.phone
       FROM members m
       WHERE LOWER(m.status) = 'active'
         AND m.id::text NOT IN (
           SELECT DISTINCT unnest(attended_member_ids) FROM attendance_records
           WHERE service_date >= $1 AND attended_member_ids IS NOT NULL AND array_length(attended_member_ids, 1) > 0
         )
       ORDER BY m.last_name, m.first_name LIMIT 15`,
      [fourWeeksAgo]
    ),
    pool.query(
      `SELECT id, first_name, last_name, date_of_birth FROM members
       WHERE date_of_birth IS NOT NULL AND LOWER(status) = 'active'
       ORDER BY CASE WHEN
         MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM date_of_birth)::int, EXTRACT(DAY FROM date_of_birth)::int) >= CURRENT_DATE
       THEN MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM date_of_birth)::int, EXTRACT(DAY FROM date_of_birth)::int)
       ELSE MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::int + 1, EXTRACT(MONTH FROM date_of_birth)::int, EXTRACT(DAY FROM date_of_birth)::int) END
       LIMIT 8`
    ),
    pool.query(
      `SELECT COUNT(*)::int as total_groups, (SELECT COUNT(*)::int FROM group_members) as total_members
       FROM small_groups WHERE is_active = true`
    ),
    pool.query(
      `SELECT m.id, m.first_name, m.last_name,
         (SELECT COUNT(*) FROM event_checkins ec WHERE ec.member_id = m.id) as checkins,
         (SELECT COUNT(*) FROM donations d WHERE d.member_id = m.id AND d.donation_date >= $1) as recent_giving
       FROM members m WHERE LOWER(m.status) = 'active'
       ORDER BY checkins DESC, recent_giving DESC LIMIT 5`,
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

  return {
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
  };
}

async function getSettings() {
  const { rows } = await pool.query(
    "SELECT value FROM system_settings WHERE key = 'church_currency' LIMIT 1"
  );
  if (!rows[0]?.value) return { currencyCode: 'USD', currencySymbol: '$' };
  try {
    const parsed = JSON.parse(rows[0].value);
    return {
      currencyCode: parsed.currencyCode || 'USD',
      currencySymbol: parsed.currencySymbol || '$',
    };
  } catch {
    return { currencyCode: 'USD', currencySymbol: '$' };
  }
}

const MEMBER_COLS = `id, first_name, last_name, email, phone, address, date_of_birth, status, role, membership_date, household_id, created_at`;

export async function loadBootstrapData(memberId = null) {
  const [
    settings,
    members,
    visitors,
    attendance,
    events,
    donations,
    followups,
    ministries,
    sermons,
    announcements,
    prayer,
    devotionals,
    media,
    leaders,
    households,
    funds,
    campaigns,
    pledges,
    volunteerRoles,
    volunteerAssignments,
    songs,
    worshipPlans,
    communications,
    forms,
    checkins,
    finance,
    insights,
    books,
    livestreams,
    bookPurchases,
  ] = await Promise.all([
    getSettings(),
    pool.query(`SELECT ${MEMBER_COLS} FROM members ORDER BY created_at DESC`),
    pool.query('SELECT * FROM visitors ORDER BY created_at DESC'),
    pool.query('SELECT * FROM attendance_records ORDER BY service_date DESC LIMIT 100'),
    pool.query('SELECT * FROM events ORDER BY event_date DESC'),
    pool.query('SELECT * FROM donations ORDER BY donation_date DESC LIMIT 500'),
    pool.query('SELECT * FROM follow_ups ORDER BY created_at DESC'),
    pool.query('SELECT * FROM ministries ORDER BY name'),
    pool.query('SELECT * FROM sermons ORDER BY sermon_date DESC LIMIT 100'),
    pool.query('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 50'),
    pool.query('SELECT * FROM prayer_requests ORDER BY created_at DESC LIMIT 100'),
    pool.query('SELECT * FROM devotionals ORDER BY devotional_date DESC LIMIT 50'),
    pool.query('SELECT * FROM media ORDER BY created_at DESC LIMIT 100'),
    pool.query(`
      SELECT DISTINCT m.id, m.first_name, m.last_name, m.email
      FROM members m
      LEFT JOIN ministry_members mm ON m.id = mm.member_id
      WHERE mm.role IN ('Leader', 'Head', 'Pastor') OR m.id IN (
        SELECT DISTINCT leader_id FROM ministries WHERE leader_id IS NOT NULL
      )
      ORDER BY m.first_name, m.last_name
    `),
    pool.query(`
      SELECT h.*,
        CONCAT(pm.first_name, ' ', pm.last_name) AS primary_member_name,
        (SELECT COUNT(*)::int FROM members m WHERE m.household_id = h.id) AS member_count
      FROM households h
      LEFT JOIN members pm ON h.primary_member_id = pm.id
      ORDER BY h.name ASC
    `),
    pool.query('SELECT * FROM funds ORDER BY name'),
    pool.query('SELECT * FROM pledge_campaigns ORDER BY created_at DESC'),
    pool.query('SELECT * FROM pledges ORDER BY created_at DESC'),
    pool.query(`SELECT vr.*, ministries.name as ministry_name FROM volunteer_roles vr LEFT JOIN ministries ON vr.ministry_id = ministries.id ORDER BY vr.name`),
    pool.query(`
      SELECT va.*, CONCAT(m.first_name, ' ', m.last_name) as member_name, e.title as event_title
      FROM volunteer_assignments va
      LEFT JOIN members m ON va.member_id = m.id
      LEFT JOIN events e ON va.event_id = e.id
      ORDER BY va.assignment_date DESC LIMIT 200
    `),
    pool.query('SELECT * FROM songs ORDER BY title'),
    pool.query('SELECT * FROM worship_plans ORDER BY service_date DESC LIMIT 50'),
    pool.query('SELECT * FROM communications ORDER BY sent_at DESC LIMIT 100'),
    pool.query('SELECT * FROM custom_forms ORDER BY created_at DESC'),
    pool.query(`
      SELECT ec.*, CONCAT(m.first_name, ' ', m.last_name) as member_name, m.email, e.title as event_title
      FROM event_checkins ec
      JOIN members m ON ec.member_id = m.id
      JOIN events e ON ec.event_id = e.id
      ORDER BY ec.checkin_time DESC LIMIT 200
    `),
    pool.query('SELECT * FROM finance_transactions ORDER BY transaction_date DESC LIMIT 500'),
    getDashboardInsights(),
    pool.query('SELECT * FROM books ORDER BY title'),
    pool.query('SELECT * FROM live_streams ORDER BY stream_date DESC LIMIT 20'),
    memberId
      ? pool.query('SELECT book_id FROM book_purchases WHERE member_id = $1', [memberId])
      : Promise.resolve({ rows: [] }),
  ]);

  return {
    settings,
    members: members.rows,
    visitors: visitors.rows,
    attendance: attendance.rows,
    events: events.rows,
    donations: donations.rows,
    followups: followups.rows,
    ministries: ministries.rows,
    sermons: sermons.rows,
    announcements: announcements.rows,
    prayer: prayer.rows,
    devotionals: devotionals.rows,
    media: media.rows,
    leaders: leaders.rows,
    households: households.rows,
    funds: funds.rows,
    campaigns: campaigns.rows,
    pledges: pledges.rows,
    volunteerRoles: volunteerRoles.rows,
    volunteerAssignments: volunteerAssignments.rows,
    songs: songs.rows,
    worshipPlans: worshipPlans.rows,
    communications: communications.rows,
    forms: forms.rows,
    checkins: checkins.rows,
    finance: finance.rows,
    insights,
    books: books.rows,
    livestreams: livestreams.rows,
    bookPurchases: bookPurchases.rows.map(r => r.book_id),
  };
}
