import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT h.*, 
        CONCAT(pm.first_name, ' ', pm.last_name) as primary_member_name,
        (SELECT COUNT(*) FROM members m WHERE m.household_id = h.id) as member_count
      FROM households h
      LEFT JOIN members pm ON h.primary_member_id = pm.id
      ORDER BY h.name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, address, primary_member_id } = req.body;
    const result = await pool.query(
      'INSERT INTO households (name, address, primary_member_id) VALUES ($1, $2, $3) RETURNING *',
      [name, address, primary_member_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/members', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM members WHERE household_id = $1 ORDER BY first_name',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, address, primary_member_id } = req.body;
    const result = await pool.query(
      'UPDATE households SET name = $1, address = $2, primary_member_id = $3 WHERE id = $4 RETURNING *',
      [name, address, primary_member_id, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Household not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
