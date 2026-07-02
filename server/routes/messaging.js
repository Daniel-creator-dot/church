import express from 'express';
import pool from '../db.js';
import { getMessagingConfig } from '../services/messaging.js';

const router = express.Router();

router.get('/config', async (req, res) => {
  try {
    const config = getMessagingConfig();
    res.json({
      ...config,
      message: config.provider === 'stub'
        ? 'SMS messages are queued in stub mode. Set MESSAGING_PROVIDER=twilio and Twilio env vars to send for real.'
        : config.twilioConfigured
        ? 'Twilio SMS is configured and ready.'
        : 'Twilio selected but credentials missing.',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/outbox', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const result = await pool.query(
      `SELECT * FROM message_outbox ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
