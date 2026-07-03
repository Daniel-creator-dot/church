import express from 'express';
import pool from '../db.js';
import { sendSms, buildVolunteerSmsReminder } from '../services/messaging.js';
import { notifyVolunteerScheduled } from '../services/smsNotifications.js';

const router = express.Router();

async function getUpcomingAssignments(days) {
  return pool.query(`
    SELECT va.*, m.email, m.phone, m.first_name, m.last_name, e.title AS event_title
    FROM volunteer_assignments va
    JOIN members m ON va.member_id = m.id
    LEFT JOIN events e ON va.event_id = e.id
    WHERE va.assignment_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + $1::integer)
      AND va.status IN ('Scheduled', 'Confirmed')
    ORDER BY va.assignment_date ASC
  `, [days]);
}

router.get('/roles', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT vr.*, ministries.name as ministry_name
      FROM volunteer_roles vr
      LEFT JOIN ministries ON vr.ministry_id = ministries.id
      ORDER BY vr.name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/roles', async (req, res) => {
  try {
    const { name, description, ministry_id } = req.body;
    const result = await pool.query(
      'INSERT INTO volunteer_roles (name, description, ministry_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, ministry_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/assignments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT va.*, CONCAT(m.first_name, ' ', m.last_name) as member_name, e.title as event_title
      FROM volunteer_assignments va
      LEFT JOIN members m ON va.member_id = m.id
      LEFT JOIN events e ON va.event_id = e.id
      ORDER BY va.assignment_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/assignments', async (req, res) => {
  try {
    const { event_id, member_id, role_id, role_name, assignment_date, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO volunteer_assignments (event_id, member_id, role_id, role_name, assignment_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [event_id, member_id, role_id, role_name, assignment_date, notes]
    );
    notifyVolunteerScheduled(result.rows[0].id);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/assignments/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const result = await pool.query(
      'UPDATE volunteer_assignments SET status = $1, notes = $2 WHERE id = $3 RETURNING *',
      [status, notes, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Assignment not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Email reminders — logs to communications, returns mailto links
router.post('/remind', async (req, res) => {
  try {
    const { days = 7, sent_by } = req.body;
    const upcoming = await getUpcomingAssignments(days);
    const withEmail = upcoming.rows.filter(row => row.email);

    const reminders = [];
    for (const row of withEmail) {
      const subject = `Volunteer Reminder: ${row.role_name} on ${row.assignment_date}`;
      const eventPart = row.event_title ? ` for "${row.event_title}"` : '';
      const body = `Dear ${row.first_name},\n\nThis is a reminder that you are scheduled to serve as ${row.role_name}${eventPart} on ${row.assignment_date}.\n\nThank you for serving!\nBethel Baptist Church`;

      await pool.query(
        `INSERT INTO communications (subject, body, channel, target_group, status, sent_by)
         VALUES ($1, $2, 'email', 'volunteers', 'Sent', $3)`,
        [subject, body, sent_by || 'system']
      );

      await pool.query(
        `UPDATE volunteer_assignments SET status = 'Confirmed', notes = COALESCE(notes, '') || ' [Email reminded]' WHERE id = $1`,
        [row.id]
      );

      const mailtoSubject = encodeURIComponent(subject);
      const mailtoBody = encodeURIComponent(body);
      reminders.push({
        assignmentId: row.id,
        memberName: `${row.first_name} ${row.last_name}`,
        email: row.email,
        roleName: row.role_name,
        assignmentDate: row.assignment_date,
        eventTitle: row.event_title,
        subject,
        mailto: `mailto:${row.email}?subject=${mailtoSubject}&body=${mailtoBody}`,
      });
    }

    res.json({ count: reminders.length, channel: 'email', reminders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SMS reminders — queued via messaging service (stub until Twilio API is configured)
router.post('/remind-sms', async (req, res) => {
  try {
    const { days = 7, sent_by } = req.body;
    const upcoming = await getUpcomingAssignments(days);
    const withPhone = upcoming.rows.filter(row => {
      const digits = (row.phone || '').replace(/\D/g, '');
      return digits.length >= 7;
    });

    const reminders = [];
    for (const row of withPhone) {
      const body = buildVolunteerSmsReminder({
        firstName: row.first_name,
        roleName: row.role_name,
        assignmentDate: row.assignment_date,
        eventTitle: row.event_title,
      });
      const subject = `Volunteer: ${row.role_name} on ${row.assignment_date}`;

      try {
        const outbox = await sendSms({
          to: row.phone,
          body,
          subject,
          referenceType: 'volunteer_assignment',
          referenceId: row.id,
          sentBy: sent_by || 'system',
        });

        await pool.query(
          `INSERT INTO communications (subject, body, channel, target_group, status, sent_by)
           VALUES ($1, $2, 'sms', 'volunteers', $3, $4)`,
          [subject, body, outbox.status === 'sent' ? 'Sent' : 'Queued', sent_by || 'system']
        );

        await pool.query(
          `UPDATE volunteer_assignments SET status = 'Confirmed', notes = COALESCE(notes, '') || ' [SMS reminded]' WHERE id = $1`,
          [row.id]
        );

        reminders.push({
          assignmentId: row.id,
          memberName: `${row.first_name} ${row.last_name}`,
          phone: row.phone,
          roleName: row.role_name,
          assignmentDate: row.assignment_date,
          status: outbox.status,
          outboxId: outbox.id,
        });
      } catch (error) {
        reminders.push({
          assignmentId: row.id,
          memberName: `${row.first_name} ${row.last_name}`,
          phone: row.phone,
          roleName: row.role_name,
          assignmentDate: row.assignment_date,
          status: 'failed',
          error: error.message,
        });
      }
    }

    res.json({
      count: reminders.length,
      channel: 'sms',
      sent: reminders.filter(r => r.status === 'sent' || r.status === 'stub').length,
      reminders,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
