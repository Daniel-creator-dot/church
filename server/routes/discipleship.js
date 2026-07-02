import express from 'express';
import pool from '../db.js';

const router = express.Router();

const DEFAULT_STEPS = [
  { title: 'Salvation & New Birth', description: 'Understand and confess faith in Christ', category: 'New Convert', sort_order: 1 },
  { title: 'Water Baptism', description: 'Public declaration of faith through baptism', category: 'New Convert', sort_order: 2 },
  { title: 'Holy Spirit Baptism', description: 'Receive the infilling of the Holy Spirit', category: 'New Convert', sort_order: 3 },
  { title: 'Membership Class', description: 'Complete new members orientation', category: 'New Convert', sort_order: 4 },
  { title: 'Join a Small Group', description: 'Connect with a life group for fellowship', category: 'New Convert', sort_order: 5 },
  { title: 'Start Serving', description: 'Discover and join a ministry department', category: 'New Convert', sort_order: 6 },
];

async function seedIfEmpty() {
  const { rows } = await pool.query('SELECT COUNT(*)::int as c FROM discipleship_steps');
  if (rows[0].c > 0) return;
  for (const s of DEFAULT_STEPS) {
    await pool.query(
      `INSERT INTO discipleship_steps (title, description, category, sort_order) VALUES ($1,$2,$3,$4)`,
      [s.title, s.description, s.category, s.sort_order]
    );
  }
}

router.get('/steps', async (req, res) => {
  try {
    await seedIfEmpty();
    const result = await pool.query(
      'SELECT * FROM discipleship_steps WHERE is_active = true ORDER BY sort_order, id'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/steps', async (req, res) => {
  try {
    const { title, description, category, sort_order } = req.body;
    const result = await pool.query(
      `INSERT INTO discipleship_steps (title, description, category, sort_order) VALUES ($1,$2,$3,$4) RETURNING *`,
      [title, description, category || 'New Convert', sort_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/progress/:memberId', async (req, res) => {
  try {
    await seedIfEmpty();
    const result = await pool.query(
      `SELECT p.*, s.title, s.description, s.category, s.sort_order
       FROM member_pathway_progress p
       JOIN discipleship_steps s ON p.step_id = s.id
       WHERE p.member_id = $1
       ORDER BY s.sort_order`,
      [req.params.memberId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/overview', async (req, res) => {
  try {
    await seedIfEmpty();
    const result = await pool.query(`
      SELECT m.id, m.first_name, m.last_name,
        COUNT(p.id) FILTER (WHERE p.status = 'Completed')::int as completed,
        (SELECT COUNT(*)::int FROM discipleship_steps WHERE is_active = true) as total
      FROM members m
      LEFT JOIN member_pathway_progress p ON p.member_id = m.id
      WHERE LOWER(m.status) = 'active'
      GROUP BY m.id, m.first_name, m.last_name
      HAVING COUNT(p.id) FILTER (WHERE p.status = 'Completed') > 0
         OR COUNT(p.id) = 0
      ORDER BY completed DESC, m.last_name
      LIMIT 30
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/progress', async (req, res) => {
  try {
    const { member_id, step_id, status, notes } = req.body;
    const completed_date = status === 'Completed' ? new Date().toISOString().split('T')[0] : null;
    const result = await pool.query(
      `INSERT INTO member_pathway_progress (member_id, step_id, status, completed_date, notes)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (member_id, step_id) DO UPDATE SET status=$3, completed_date=$4, notes=$5
       RETURNING *`,
      [member_id, step_id, status || 'Pending', completed_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
