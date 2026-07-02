import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/roles', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT vr.*, m.name as ministry_name
      FROM volunteer_roles vr
      LEFT JOIN ministries m ON vr.ministry_id = m.id
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

export default router;
