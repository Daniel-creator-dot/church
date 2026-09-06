import express from 'express';
import pool from '../db.js';
import { loadBootstrapData } from '../services/bootstrap.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    let memberId = req.query.member_id ? parseInt(req.query.member_id, 10) : null;
    if (!Number.isFinite(memberId) && req.query.email) {
      const found = await pool.query(
        'SELECT id FROM members WHERE LOWER(email) = LOWER($1) LIMIT 1',
        [String(req.query.email).trim()]
      );
      memberId = found.rows[0]?.id ?? null;
    }
    const data = await loadBootstrapData(Number.isFinite(memberId) ? memberId : null);
    res.set('Cache-Control', 'private, max-age=15');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
