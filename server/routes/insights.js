import express from 'express';
import pool from '../db.js';
import { getDashboardInsights } from '../services/bootstrap.js';

const router = express.Router();

router.get('/dashboard', async (req, res) => {
  try {
    const data = await getDashboardInsights();
    res.set('Cache-Control', 'private, max-age=30');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
