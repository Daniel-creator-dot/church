import express from 'express';
import pool from '../db.js';

const router = express.Router();

async function seedIfEmpty() {
  const { rows } = await pool.query('SELECT COUNT(*)::int as c FROM live_streams');
  if (rows[0].c > 0) return;
  await pool.query(
    `INSERT INTO live_streams (title, speaker, stream_date, stream_time, status, embed_url, description)
     VALUES ($1,$2,CURRENT_DATE,$3,$4,$5,$6)`,
    [
      'Sunday Glory Celebration Service',
      'Pastor John Wilson',
      '09:00 AM',
      'Upcoming',
      'https://www.youtube.com/embed/jfKfPfyJRdk',
      'Join us live for worship, testimonies, and a life-transforming sermon.',
    ]
  );
}

router.get('/', async (req, res) => {
  try {
    await seedIfEmpty();
    const result = await pool.query('SELECT * FROM live_streams ORDER BY stream_date DESC, created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, speaker, stream_date, stream_time, status, embed_url, description } = req.body;
    if (status === 'Live') {
      await pool.query(`UPDATE live_streams SET status = 'Completed' WHERE status = 'Live'`);
    }
    const result = await pool.query(
      `INSERT INTO live_streams (title, speaker, stream_date, stream_time, status, embed_url, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, speaker, stream_date, stream_time, status || 'Upcoming', embed_url, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, speaker, stream_date, stream_time, status, embed_url, description } = req.body;
    if (status === 'Live') {
      await pool.query(`UPDATE live_streams SET status = 'Completed' WHERE status = 'Live' AND id != $1`, [req.params.id]);
    }
    const result = await pool.query(
      `UPDATE live_streams SET title=$1, speaker=$2, stream_date=$3, stream_time=$4, status=$5, embed_url=$6, description=$7
       WHERE id=$8 RETURNING *`,
      [title, speaker, stream_date, stream_time, status, embed_url, description, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Stream not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM live_streams WHERE id = $1', [req.params.id]);
    res.json({ message: 'Stream deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
