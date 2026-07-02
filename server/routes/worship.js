import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/songs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM songs ORDER BY title ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/songs', async (req, res) => {
  try {
    const { title, artist, song_key, theme, lyrics } = req.body;
    const result = await pool.query(
      'INSERT INTO songs (title, artist, song_key, theme, lyrics) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, artist, song_key, theme, lyrics]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/plans', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM worship_plans ORDER BY service_date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/plans/:id', async (req, res) => {
  try {
    const plan = await pool.query('SELECT * FROM worship_plans WHERE id = $1', [req.params.id]);
    if (!plan.rows.length) return res.status(404).json({ error: 'Plan not found' });
    const items = await pool.query(
      `SELECT wpi.*, s.title as song_title, s.artist as song_artist
       FROM worship_plan_items wpi
       LEFT JOIN songs s ON wpi.song_id = s.id
       WHERE wpi.plan_id = $1 ORDER BY wpi.sort_order ASC`,
      [req.params.id]
    );
    res.json({ ...plan.rows[0], items: items.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/plans', async (req, res) => {
  try {
    const { title, service_date, service_type, notes, items } = req.body;
    const plan = await pool.query(
      'INSERT INTO worship_plans (title, service_date, service_type, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, service_date, service_type, notes]
    );
    const planId = plan.rows[0].id;
    if (items?.length) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await pool.query(
          `INSERT INTO worship_plan_items (plan_id, item_type, title, song_id, duration_minutes, assigned_to, sort_order, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [planId, item.item_type, item.title, item.song_id, item.duration_minutes, item.assigned_to, i, item.notes]
        );
      }
    }
    res.status(201).json(plan.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
