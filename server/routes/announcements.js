import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM announcements ORDER BY announcement_date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, content, announcement_date, category, status } = req.body;
    const result = await pool.query(
      `INSERT INTO announcements (title, content, announcement_date, category, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, content, announcement_date, category || 'General', status || 'Published']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, announcement_date, category, status } = req.body;
    const result = await pool.query(
      `UPDATE announcements SET title = $1, content = $2, announcement_date = $3, category = $4, status = $5
       WHERE id = $6 RETURNING *`,
      [title, content, announcement_date, category, status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Announcement not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM announcements WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Announcement not found' });
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
