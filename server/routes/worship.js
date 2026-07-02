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

router.put('/plans/:id', async (req, res) => {
  try {
    const { title, service_date, service_type, notes } = req.body;
    const result = await pool.query(
      'UPDATE worship_plans SET title = $1, service_date = $2, service_type = $3, notes = $4 WHERE id = $5 RETURNING *',
      [title, service_date, service_type, notes, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Plan not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/plans/:planId/items', async (req, res) => {
  try {
    const { item_type, title, song_id, duration_minutes, assigned_to, notes, sort_order } = req.body;
    const maxOrder = await pool.query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM worship_plan_items WHERE plan_id = $1',
      [req.params.planId]
    );
    const order = sort_order ?? maxOrder.rows[0].next_order;
    const result = await pool.query(
      `INSERT INTO worship_plan_items (plan_id, item_type, title, song_id, duration_minutes, assigned_to, sort_order, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.params.planId, item_type, title, song_id, duration_minutes, assigned_to, order, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/plans/:planId/items/:itemId', async (req, res) => {
  try {
    const { item_type, title, song_id, duration_minutes, assigned_to, notes, sort_order } = req.body;
    const result = await pool.query(
      `UPDATE worship_plan_items SET item_type = $1, title = $2, song_id = $3, duration_minutes = $4, assigned_to = $5, sort_order = $6, notes = $7
       WHERE id = $8 AND plan_id = $9 RETURNING *`,
      [item_type, title, song_id, duration_minutes, assigned_to, sort_order, notes, req.params.itemId, req.params.planId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/plans/:planId/items/:itemId', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM worship_plan_items WHERE id = $1 AND plan_id = $2 RETURNING *',
      [req.params.itemId, req.params.planId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/plans/:planId/items/reorder', async (req, res) => {
  try {
    const { itemIds } = req.body;
    for (let i = 0; i < itemIds.length; i++) {
      await pool.query(
        'UPDATE worship_plan_items SET sort_order = $1 WHERE id = $2 AND plan_id = $3',
        [i, itemIds[i], req.params.planId]
      );
    }
    res.json({ message: 'Reordered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
