import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all ministries
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, 
        (SELECT COUNT(*) FROM ministry_members mm WHERE mm.ministry_id = m.id) as member_count,
        CONCAT(leader.first_name, ' ', leader.last_name) as leader_name
      FROM ministries m
      LEFT JOIN members leader ON m.leader_id = leader.id
      ORDER BY m.name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ministry by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT m.*, 
        CONCAT(leader.first_name, ' ', leader.last_name) as leader_name
      FROM ministries m
      LEFT JOIN members leader ON m.leader_id = leader.id
      WHERE m.id = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ministry not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ministry members
router.get('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT mm.*, m.first_name, m.last_name, m.email, m.phone
      FROM ministry_members mm
      JOIN members m ON mm.member_id = m.id
      WHERE mm.ministry_id = $1
      ORDER BY mm.join_date ASC
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new ministry
router.post('/', async (req, res) => {
  try {
    const { name, description, leader_id } = req.body;
    const result = await pool.query(
      'INSERT INTO ministries (name, description, leader_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, leader_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update ministry
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, leader_id } = req.body;
    const result = await pool.query(
      'UPDATE ministries SET name = $1, description = $2, leader_id = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, description, leader_id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ministry not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete ministry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM ministries WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ministry not found' });
    }
    res.json({ message: 'Ministry deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add member to ministry
router.post('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const { member_id, role } = req.body;
    const result = await pool.query(
      'INSERT INTO ministry_members (ministry_id, member_id, role) VALUES ($1, $2, $3) RETURNING *',
      [id, member_id, role || 'member']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove member from ministry
router.delete('/:id/members/:memberId', async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const result = await pool.query(
      'DELETE FROM ministry_members WHERE ministry_id = $1 AND member_id = $2 RETURNING *',
      [id, memberId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found in this ministry' });
    }
    res.json({ message: 'Member removed from ministry successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
