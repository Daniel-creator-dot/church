import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ft.*, f.name as fund_name
      FROM finance_transactions ft
      LEFT JOIN funds f ON ft.fund_id = f.id
      ORDER BY ft.transaction_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const income = await pool.query("SELECT COALESCE(SUM(amount),0) as total FROM finance_transactions WHERE type = 'Income'");
    const expense = await pool.query("SELECT COALESCE(SUM(amount),0) as total FROM finance_transactions WHERE type = 'Expense'");
    const byCategory = await pool.query(`
      SELECT category, type, SUM(amount) as total
      FROM finance_transactions GROUP BY category, type ORDER BY total DESC
    `);
    res.json({
      total_income: income.rows[0].total,
      total_expense: expense.rows[0].total,
      net: parseFloat(income.rows[0].total) - parseFloat(expense.rows[0].total),
      by_category: byCategory.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { transaction_date, type, category, fund_id, amount, description, approved_by } = req.body;
    const result = await pool.query(
      `INSERT INTO finance_transactions (transaction_date, type, category, fund_id, amount, description, approved_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [transaction_date, type, category, fund_id, amount, description, approved_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
