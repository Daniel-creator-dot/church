import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, m.name as ministry_name
      FROM communications c
      LEFT JOIN ministries m ON c.ministry_id = m.id
      ORDER BY c.sent_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { subject, body, channel, target_group, ministry_id, sent_by } = req.body;
    const result = await pool.query(
      `INSERT INTO communications (subject, body, channel, target_group, ministry_id, sent_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [subject, body, channel || 'email', target_group || 'all', ministry_id, sent_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
