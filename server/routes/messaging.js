import express from 'express';
import pool from '../db.js';
import { getMessagingConfig, getIntekBalance } from '../services/messaging.js';
import { SMS_TRIGGERS } from '../services/smsNotifications.js';

const router = express.Router();

function configMessage(config) {
  if (config.provider === 'intek') {
    if (config.intekConfigured) {
      return `Intek SMS active — sender "${config.sender || 'mychurch'}".`;
    }
    return 'Intek selected but INTEK_API_KEY is missing.';
  }
  if (config.provider === 'twilio') {
    if (config.twilioConfigured) return 'Twilio SMS is configured and ready.';
    return 'Twilio selected but credentials missing.';
  }
  return 'SMS messages are queued in stub mode. Set MESSAGING_PROVIDER=intek and INTEK_API_KEY to send for real.';
}

router.get('/config', async (req, res) => {
  try {
    const config = getMessagingConfig();
    let balanceUnits = null;
    if (config.provider === 'intek' && config.intekConfigured) {
      balanceUnits = await getIntekBalance();
    }
    res.json({
      ...config,
      balanceUnits,
      triggers: SMS_TRIGGERS,
      message: configMessage(config),
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
