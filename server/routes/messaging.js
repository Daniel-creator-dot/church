import express from 'express';
import pool from '../db.js';
import {
  getMessagingConfig,
  getPublicMessagingConfig,
  getIntekBalance,
  loadSmsConfigFromDb,
  saveSmsConfig,
  sendSms,
  syncIntekDeliveryStatus,
} from '../services/messaging.js';
import { SMS_TRIGGERS } from '../services/smsNotifications.js';

const router = express.Router();

function configMessage(config) {
  if (!config.smsEnabled) {
    return 'SMS is turned off. Enable it below to send messages.';
  }
  if (config.provider === 'intek') {
    if (config.intekConfigured) {
      return `Intek SMS active — sender "${config.sender || 'mychurch'}".`;
    }
    return 'Intek selected but API key is missing. Paste your Intek API key below.';
  }
  if (config.provider === 'twilio') {
    if (config.twilioConfigured) return 'Twilio SMS is configured and ready.';
    return 'Twilio selected but credentials are incomplete.';
  }
  return 'SMS is in stub mode (messages are logged but not sent). Choose Intek and add your API key.';
}

router.get('/config', async (req, res) => {
  try {
    await loadSmsConfigFromDb();
    const publicConfig = getPublicMessagingConfig();
    const config = getMessagingConfig();
    let balanceUnits = null;
    if (config.provider === 'intek' && config.intekConfigured) {
      try {
        balanceUnits = await getIntekBalance();
      } catch {
        balanceUnits = null;
      }
    }
    res.json({
      ...publicConfig,
      balanceUnits,
      triggers: SMS_TRIGGERS,
      message: configMessage(publicConfig),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/config', async (req, res) => {
  try {
    const {
      provider,
      smsEnabled,
      intekApiKey,
      intekSender,
      intekApiUrl,
      twilioAccountSid,
      twilioAuthToken,
      twilioFromNumber,
      clearIntekApiKey,
      clearTwilioAuthToken,
    } = req.body || {};

    await saveSmsConfig({
      provider,
      smsEnabled,
      intekApiKey,
      intekSender,
      intekApiUrl,
      twilioAccountSid,
      twilioAuthToken,
      twilioFromNumber,
      clearIntekApiKey,
      clearTwilioAuthToken,
    });

    const publicConfig = getPublicMessagingConfig();
    let balanceUnits = null;
    if (publicConfig.provider === 'intek' && publicConfig.intekConfigured) {
      try {
        balanceUnits = await getIntekBalance();
      } catch {
        balanceUnits = null;
      }
    }

    res.json({
      ...publicConfig,
      balanceUnits,
      triggers: SMS_TRIGGERS,
      message: configMessage(publicConfig),
      success: true,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/test', async (req, res) => {
  try {
    await loadSmsConfigFromDb();
    const { phone, message } = req.body || {};
    if (!phone) return res.status(400).json({ error: 'phone is required' });

    const body =
      message ||
      'Test SMS from Liberty Assemblies of God. Your SMS settings are working.';

    const result = await sendSms({
      to: phone,
      body,
      subject: 'SMS test',
      referenceType: 'sms_test',
      sentBy: 'settings',
    });

    res.json({
      success: true,
      status: result.status,
      outboxId: result.id,
      recipient: result.recipient,
      message: result.status === 'stub'
        ? 'Queued in stub mode — add an Intek API key to send for real.'
        : `SMS ${result.status} to ${result.recipient}.`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/outbox', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const sync = req.query.sync === '1' || req.query.sync === 'true';
    if (sync) {
      await loadSmsConfigFromDb();
      await syncIntekDeliveryStatus(Math.min(limit, 40));
    }
    const result = await pool.query(
      `SELECT * FROM message_outbox ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/sync-delivery', async (req, res) => {
  try {
    await loadSmsConfigFromDb();
    const result = await syncIntekDeliveryStatus(40);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
