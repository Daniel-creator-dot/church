import express from 'express';
import pool from '../db.js';

const router = express.Router();

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
