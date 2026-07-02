import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM custom_forms ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, fields, is_public, is_anonymous } = req.body;
    const result = await pool.query(
      `INSERT INTO custom_forms (title, description, fields, is_public, is_anonymous)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, description, JSON.stringify(fields || []), is_public, is_anonymous]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/submissions', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM form_submissions WHERE form_id = $1 ORDER BY submitted_at DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/submit', async (req, res) => {
  try {
    const { submitter_name, submitter_email, responses } = req.body;
    const result = await pool.query(
      `INSERT INTO form_submissions (form_id, submitter_name, submitter_email, responses)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.id, submitter_name, submitter_email, JSON.stringify(responses || {})]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
