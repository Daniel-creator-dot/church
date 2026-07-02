import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all follow-ups
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, 
        CONCAT(target.first_name, ' ', target.last_name) as target_full_name,
        CONCAT(assigned.first_name, ' ', assigned.last_name) as assigned_full_name
      FROM follow_ups f
      LEFT JOIN members target ON f.target_person_id = target.id
      LEFT JOIN members assigned ON f.assigned_to_id = assigned.id
      ORDER BY f.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get follow-up by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT f.*, 
        CONCAT(target.first_name, ' ', target.last_name) as target_full_name,
        CONCAT(assigned.first_name, ' ', assigned.last_name) as assigned_full_name
      FROM follow_ups f
      LEFT JOIN members target ON f.target_person_id = target.id
      LEFT JOIN members assigned ON f.assigned_to_id = assigned.id
      WHERE f.id = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Follow-up not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all members for dropdown (for target person selection)
router.get('/members/list', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, first_name, last_name, email, status
      FROM members 
      ORDER BY first_name ASC, last_name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all leaders/officers for dropdown (for assigned to selection)
router.get('/leaders/list', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT m.id, m.first_name, m.last_name, m.email
      FROM members m
      LEFT JOIN ministry_members mm ON m.id = mm.member_id
      WHERE mm.role IN ('Leader', 'Head', 'Pastor') OR m.id IN (
        SELECT DISTINCT leader_id FROM ministries WHERE leader_id IS NOT NULL
      )
      ORDER BY m.first_name ASC, m.last_name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new follow-up
router.post('/', async (req, res) => {
  try {
    const { target_person_id, target_person_name, category, assigned_to_id, assigned_to_name, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO follow_ups (target_person_id, target_person_name, category, assigned_to_id, assigned_to_name, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [target_person_id, target_person_name, category, assigned_to_id, assigned_to_name, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update follow-up
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { target_person_id, target_person_name, category, assigned_to_id, assigned_to_name, status, notes } = req.body;
    const result = await pool.query(
      'UPDATE follow_ups SET target_person_id = $1, target_person_name = $2, category = $3, assigned_to_id = $4, assigned_to_name = $5, status = $6, notes = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
      [target_person_id, target_person_name, category, assigned_to_id, assigned_to_name, status, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Follow-up not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete follow-up
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM follow_ups WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Follow-up not found' });
    }
    res.json({ message: 'Follow-up deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
