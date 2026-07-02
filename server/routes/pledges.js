import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/campaigns', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, f.name as fund_name,
        COALESCE((SELECT SUM(pledged_amount) FROM pledges WHERE campaign_id = c.id), 0) as total_pledged,
        COALESCE((SELECT SUM(fulfilled_amount) FROM pledges WHERE campaign_id = c.id), 0) as total_fulfilled
      FROM pledge_campaigns c
      LEFT JOIN funds f ON c.fund_id = f.id
      ORDER BY c.start_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/campaigns', async (req, res) => {
  try {
    const { name, description, goal_amount, start_date, end_date, fund_id } = req.body;
    const result = await pool.query(
      `INSERT INTO pledge_campaigns (name, description, goal_amount, start_date, end_date, fund_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, goal_amount, start_date, end_date, fund_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { campaign_id } = req.query;
    let query = `
      SELECT p.*, CONCAT(m.first_name, ' ', m.last_name) as member_name, c.name as campaign_name
      FROM pledges p
      LEFT JOIN members m ON p.member_id = m.id
      LEFT JOIN pledge_campaigns c ON p.campaign_id = c.id
    `;
    const params = [];
    if (campaign_id) {
      query += ' WHERE p.campaign_id = $1';
      params.push(campaign_id);
    }
    query += ' ORDER BY p.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { campaign_id, member_id, pledgor_name, pledged_amount, frequency } = req.body;
    const result = await pool.query(
      `INSERT INTO pledges (campaign_id, member_id, pledgor_name, pledged_amount, frequency)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [campaign_id, member_id, pledgor_name, pledged_amount, frequency || 'one-time']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { fulfilled_amount, pledged_amount } = req.body;
    const result = await pool.query(
      'UPDATE pledges SET fulfilled_amount = $1, pledged_amount = $2 WHERE id = $3 RETURNING *',
      [fulfilled_amount, pledged_amount, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Pledge not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
