import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM devotionals ORDER BY devotional_date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, content, devotional_date, scripture, author } = req.body;
    const result = await pool.query(
      `INSERT INTO devotionals (title, content, devotional_date, scripture, author)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, content, devotional_date, scripture, author]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, devotional_date, scripture, author } = req.body;
    const result = await pool.query(
      `UPDATE devotionals SET title = $1, content = $2, devotional_date = $3, scripture = $4, author = $5
       WHERE id = $6 RETURNING *`,
      [title, content, devotional_date, scripture, author, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Devotional not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM devotionals WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Devotional not found' });
    res.json({ message: 'Devotional deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
