import express from 'express';
import pool from '../db.js';

const router = express.Router();

const DEFAULT_SETTINGS = {
  currencyCode: 'USD',
  currencySymbol: '$',
};

const getSettingsPayload = (rowValue) => {
  if (!rowValue) return DEFAULT_SETTINGS;

  try {
    const parsed = JSON.parse(rowValue);
    return {
      currencyCode: parsed.currencyCode || DEFAULT_SETTINGS.currencyCode,
      currencySymbol: parsed.currencySymbol || DEFAULT_SETTINGS.currencySymbol,
    };
  } catch (error) {
    return DEFAULT_SETTINGS;
  }
};

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT value FROM system_settings WHERE key = 'church_currency' LIMIT 1"
    );

    res.json(getSettingsPayload(rows[0]?.value));
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({ error: 'Failed to fetch system settings' });
  }
});

router.put('/currency', async (req, res) => {
  try {
    const { currencyCode, currencySymbol } = req.body;

    if (!currencyCode || !currencySymbol) {
      return res.status(400).json({ error: 'currencyCode and currencySymbol are required' });
    }

    const payload = JSON.stringify({ currencyCode, currencySymbol });

    await pool.query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ('church_currency', $1, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
      [payload]
    );

    res.json({ currencyCode, currencySymbol });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({ error: 'Failed to update system settings' });
  }
});

export default router;
