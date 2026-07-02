import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sermons ORDER BY sermon_date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, speaker, sermon_date, theme, bible_verse, notes, video_url, audio_url } = req.body;
    const result = await pool.query(
      `INSERT INTO sermons (title, speaker, sermon_date, theme, bible_verse, notes, video_url, audio_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, speaker, sermon_date, theme, bible_verse, notes, video_url, audio_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, speaker, sermon_date, theme, bible_verse, notes, video_url, audio_url } = req.body;
    const result = await pool.query(
      `UPDATE sermons SET title = $1, speaker = $2, sermon_date = $3, theme = $4, bible_verse = $5, notes = $6, video_url = $7, audio_url = $8
       WHERE id = $9 RETURNING *`,
      [title, speaker, sermon_date, theme, bible_verse, notes, video_url, audio_url, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Sermon not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM sermons WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Sermon not found' });
    res.json({ message: 'Sermon deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
