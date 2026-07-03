import express from 'express';
import pool from '../db.js';
import { notifyEventRegistration } from '../services/smsNotifications.js';

const router = express.Router();

// Get all events
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*,
        COALESCE(array_agg(m.email) FILTER (WHERE m.email IS NOT NULL), '{}') AS rsvp_emails
      FROM events e
      LEFT JOIN event_registrations er ON e.id = er.event_id
      LEFT JOIN members m ON er.member_id = m.id
      GROUP BY e.id
      ORDER BY e.event_date ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new event
router.post('/', async (req, res) => {
  try {
    const { title, description, event_date, event_time, location, capacity } = req.body;
    const result = await pool.query(
      'INSERT INTO events (title, description, event_date, event_time, location, capacity) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, event_date, event_time, location, capacity]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update event
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, event_date, event_time, location, capacity } = req.body;
    const result = await pool.query(
      'UPDATE events SET title = $1, description = $2, event_date = $3, event_time = $4, location = $5, capacity = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [title, description, event_date, event_time, location, capacity, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register for event
router.post('/:id/register', async (req, res) => {
  try {
    const { id } = req.params;
    const { member_id } = req.body;
    const result = await pool.query(
      'INSERT INTO event_registrations (event_id, member_id) VALUES ($1, $2) RETURNING *',
      [id, member_id]
    );
    notifyEventRegistration(member_id, id);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Already registered for this event.' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get event registrations
router.get('/:id/registrations', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT er.*, m.first_name, m.last_name, m.email FROM event_registrations er JOIN members m ON er.member_id = m.id WHERE er.event_id = $1',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
