import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM funds ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, goal_amount } = req.body;
    const result = await pool.query(
      'INSERT INTO funds (name, description, goal_amount) VALUES ($1, $2, $3) RETURNING *',
      [name, description, goal_amount]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, goal_amount, is_active } = req.body;
    const result = await pool.query(
      'UPDATE funds SET name = $1, description = $2, goal_amount = $3, is_active = $4 WHERE id = $5 RETURNING *',
      [name, description, goal_amount, is_active, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Fund not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
