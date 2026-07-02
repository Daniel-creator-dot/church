import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM prayer_requests ORDER BY request_date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/wall', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM prayer_requests
       WHERE is_private = false AND status != 'Followed Up'
       ORDER BY prayed_count DESC, request_date DESC
       LIMIT 50`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/pray', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE prayer_requests SET prayed_count = COALESCE(prayed_count, 0) + 1,
       status = CASE WHEN status = 'Pending' THEN 'Prayed For' ELSE status END
       WHERE id = $1 RETURNING *`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Prayer request not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { submitted_by, email, request, is_private, status, request_date, notes, category } = req.body;
    const result = await pool.query(
      `INSERT INTO prayer_requests (submitted_by, email, request, is_private, status, request_date, notes, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [submitted_by, email, request, is_private || false, status || 'Pending', request_date, notes, category || 'General']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { submitted_by, email, request, is_private, status, request_date, notes, category } = req.body;
    const result = await pool.query(
      `UPDATE prayer_requests SET submitted_by = $1, email = $2, request = $3, is_private = $4, status = $5, request_date = $6, notes = $7, category = $8
       WHERE id = $9 RETURNING *`,
      [submitted_by, email, request, is_private, status, request_date, notes, category || 'General', id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Prayer request not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM prayer_requests WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Prayer request not found' });
    res.json({ message: 'Prayer request deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
