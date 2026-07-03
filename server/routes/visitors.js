import express from 'express';
import pool from '../db.js';
import { notifyVisitorWelcome } from '../services/smsNotifications.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM visitors ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      visit_date,
      invited_by,
      prayer_request,
      assigned_follow_up_officer,
      status,
      follow_up_notes,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO visitors (
        name,
        phone,
        email,
        visit_date,
        invited_by,
        prayer_request,
        assigned_follow_up_officer,
        status,
        follow_up_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        name,
        phone,
        email,
        visit_date || new Date().toISOString().split('T')[0],
        invited_by || '',
        prayer_request || '',
        assigned_follow_up_officer || '',
        status || 'New',
        follow_up_notes || '',
      ]
    );

    notifyVisitorWelcome({ name, phone });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      email,
      visit_date,
      invited_by,
      prayer_request,
      assigned_follow_up_officer,
      status,
      follow_up_notes,
    } = req.body;

    const result = await pool.query(
      `UPDATE visitors SET
        name = $1,
        phone = $2,
        email = $3,
        visit_date = $4,
        invited_by = $5,
        prayer_request = $6,
        assigned_follow_up_officer = $7,
        status = $8,
        follow_up_notes = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10 RETURNING *`,
      [
        name,
        phone,
        email,
        visit_date,
        invited_by || '',
        prayer_request || '',
        assigned_follow_up_officer || '',
        status || 'New',
        follow_up_notes || '',
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM visitors WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Visitor not found' });
    }
    res.json({ message: 'Visitor deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
