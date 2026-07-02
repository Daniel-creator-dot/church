import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM attendance_records ORDER BY service_date DESC, created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM attendance_records WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { service_date, service_type, headcount, attended_member_ids, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO attendance_records (service_date, service_type, headcount, attended_member_ids, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [service_date, service_type, headcount || 0, attended_member_ids || [], notes || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { service_date, service_type, headcount, attended_member_ids, notes } = req.body;
    const result = await pool.query(
      `UPDATE attendance_records
       SET service_date = $1, service_type = $2, headcount = $3, attended_member_ids = $4, notes = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [service_date, service_type, headcount, attended_member_ids, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM attendance_records WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
