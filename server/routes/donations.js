import express from 'express';
import pool from '../db.js';
import { notifyDonationReceived } from '../services/smsNotifications.js';

const router = express.Router();

// Get donation statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const totalResult = await pool.query('SELECT SUM(amount) as total FROM donations');
    const byTypeResult = await pool.query(`
      SELECT donation_type, SUM(amount) as total 
      FROM donations 
      GROUP BY donation_type
    `);
    const byMonthResult = await pool.query(`
      SELECT DATE_TRUNC('month', donation_date) as month, SUM(amount) as total 
      FROM donations 
      GROUP BY DATE_TRUNC('month', donation_date) 
      ORDER BY month DESC
    `);
    
    res.json({
      total: totalResult.rows[0].total,
      by_type: byTypeResult.rows,
      by_month: byMonthResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all donations
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, m.first_name, m.last_name 
      FROM donations d 
      LEFT JOIN members m ON d.member_id = m.id 
      ORDER BY d.donation_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get donation by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM donations WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new donation
router.post('/', async (req, res) => {
  try {
    const { member_id, amount, donation_type, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO donations (member_id, amount, donation_type, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [member_id, amount, donation_type, notes]
    );
    notifyDonationReceived(result.rows[0].id);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
