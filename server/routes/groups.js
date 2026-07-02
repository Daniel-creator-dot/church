import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.*,
        (SELECT COUNT(*)::int FROM group_members gm WHERE gm.group_id = g.id) as member_count
      FROM small_groups g
      ORDER BY g.is_active DESC, g.name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, leader_id, leader_name, meeting_day, meeting_time, location, max_members } = req.body;
    const result = await pool.query(
      `INSERT INTO small_groups (name, description, leader_id, leader_name, meeting_day, meeting_time, location, max_members)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, description, leader_id, leader_name, meeting_day, meeting_time, location, max_members || 12]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, leader_id, leader_name, meeting_day, meeting_time, location, max_members, is_active } = req.body;
    const result = await pool.query(
      `UPDATE small_groups SET name=$1, description=$2, leader_id=$3, leader_name=$4,
       meeting_day=$5, meeting_time=$6, location=$7, max_members=$8, is_active=$9
       WHERE id=$10 RETURNING *`,
      [name, description, leader_id, leader_name, meeting_day, meeting_time, location, max_members, is_active ?? true, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Group not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM small_groups WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Group not found' });
    res.json({ message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/members', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT gm.*, m.first_name, m.last_name, m.email, m.phone
      FROM group_members gm
      JOIN members m ON gm.member_id = m.id
      WHERE gm.group_id = $1
      ORDER BY gm.role, m.first_name
    `, [req.params.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/members', async (req, res) => {
  try {
    const { member_id, role } = req.body;
    const result = await pool.query(
      `INSERT INTO group_members (group_id, member_id, role) VALUES ($1, $2, $3)
       ON CONFLICT (group_id, member_id) DO UPDATE SET role = $3 RETURNING *`,
      [req.params.id, member_id, role || 'Member']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id/members/:memberId', async (req, res) => {
  try {
    await pool.query('DELETE FROM group_members WHERE group_id = $1 AND member_id = $2', [req.params.id, req.params.memberId]);
    res.json({ message: 'Member removed from group' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/meetings', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM group_meetings WHERE group_id = $1 ORDER BY meeting_date DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/meetings', async (req, res) => {
  try {
    const { meeting_date, topic, attendance_count, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO group_meetings (group_id, meeting_date, topic, attendance_count, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.id, meeting_date, topic, attendance_count || 0, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
