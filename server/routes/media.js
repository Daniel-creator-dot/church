import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM media_assets ORDER BY upload_date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, media_type, url, description, upload_date } = req.body;
    const result = await pool.query(
      `INSERT INTO media_assets (title, media_type, url, description, upload_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, media_type, url, description, upload_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, media_type, url, description, upload_date } = req.body;
    const result = await pool.query(
      `UPDATE media_assets SET title = $1, media_type = $2, url = $3, description = $4, upload_date = $5
       WHERE id = $6 RETURNING *`,
      [title, media_type, url, description, upload_date, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Media asset not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM media_assets WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Media asset not found' });
    res.json({ message: 'Media asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
