import express from 'express';
import QRCode from 'qrcode';
import pool from '../db.js';

const router = express.Router();

function getAppUrl() {
  return process.env.APP_URL || process.env.VITE_APP_URL || 'https://church-ae7v.onrender.com';
}

// Generate QR code for event check-in (must be before /:id routes)
router.get('/qr/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await pool.query('SELECT id, title, event_date FROM events WHERE id = $1', [eventId]);
    if (!event.rows.length) return res.status(404).json({ error: 'Event not found' });

    const checkInUrl = `${getAppUrl()}/?view=checkin&event=${eventId}`;
    const qrDataUrl = await QRCode.toDataURL(checkInUrl, { width: 320, margin: 2, color: { dark: '#0d9488' } });
    const count = await pool.query('SELECT COUNT(*) FROM event_checkins WHERE event_id = $1', [eventId]);

    res.json({
      eventId,
      eventTitle: event.rows[0].title,
      eventDate: event.rows[0].event_date,
      checkInUrl,
      qrDataUrl,
      checkedInCount: parseInt(count.rows[0].count),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public self-service check-in by member email (no auth required)
router.post('/public', async (req, res) => {
  try {
    const { event_id, email, family_tag } = req.body;
    if (!event_id || !email) {
      return res.status(400).json({ error: 'Event and email are required' });
    }

    const member = await pool.query(
      'SELECT id, first_name, last_name FROM members WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );
    if (!member.rows.length) {
      return res.status(404).json({ error: 'No member found with this email. Please contact the church office.' });
    }

    const insert = await pool.query(
      `INSERT INTO event_checkins (event_id, member_id, checked_in_by, family_tag)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (event_id, member_id) DO UPDATE SET checkin_time = CURRENT_TIMESTAMP, family_tag = EXCLUDED.family_tag
       RETURNING id`,
      [event_id, member.rows[0].id, 'self-checkin', family_tag || null]
    );

    const result = await pool.query(`
      SELECT ec.*, CONCAT(m.first_name, ' ', m.last_name) as member_name, m.email, e.title as event_title
      FROM event_checkins ec
      JOIN members m ON ec.member_id = m.id
      JOIN events e ON ec.event_id = e.id
      WHERE ec.id = $1
    `, [insert.rows[0].id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { event_id } = req.query;
    let query = `
      SELECT ec.*, CONCAT(m.first_name, ' ', m.last_name) as member_name, m.email, e.title as event_title
      FROM event_checkins ec
      JOIN members m ON ec.member_id = m.id
      JOIN events e ON ec.event_id = e.id
    `;
    const params = [];
    if (event_id) {
      query += ' WHERE ec.event_id = $1';
      params.push(event_id);
    }
    query += ' ORDER BY ec.checkin_time DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { event_id, member_id, checked_in_by, family_tag } = req.body;
    const insert = await pool.query(
      `INSERT INTO event_checkins (event_id, member_id, checked_in_by, family_tag)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (event_id, member_id) DO UPDATE SET checkin_time = CURRENT_TIMESTAMP
       RETURNING id`,
      [event_id, member_id, checked_in_by, family_tag]
    );
    const result = await pool.query(`
      SELECT ec.*, CONCAT(m.first_name, ' ', m.last_name) as member_name, m.email, e.title as event_title
      FROM event_checkins ec
      JOIN members m ON ec.member_id = m.id
      JOIN events e ON ec.event_id = e.id
      WHERE ec.id = $1
    `, [insert.rows[0].id]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/checkout', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE event_checkins SET checkout_time = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Check-in not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
