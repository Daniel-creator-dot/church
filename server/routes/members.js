import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all members
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM members ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get member by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM members WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new member
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, address, date_of_birth, status } = req.body;
    const result = await pool.query(
      'INSERT INTO members (first_name, last_name, email, phone, address, date_of_birth, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [first_name, last_name, email, phone, address, date_of_birth, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update member
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, address, date_of_birth, status } = req.body;
    const result = await pool.query(
      'UPDATE members SET first_name = $1, last_name = $2, email = $3, phone = $4, address = $5, date_of_birth = $6, status = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
      [first_name, last_name, email, phone, address, date_of_birth, status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete member
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM members WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
