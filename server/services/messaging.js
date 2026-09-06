import pool from '../db.js';

const SMS_SETTINGS_KEY = 'sms_config';

/** @type {{ provider?: string, smsEnabled?: boolean, intekApiKey?: string, intekSender?: string, intekApiUrl?: string, twilioAccountSid?: string, twilioAuthToken?: string, twilioFromNumber?: string } | null} */
let runtimeSmsConfig = null;

function formatSmsRecipient(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('233') && digits.length >= 12) {
    return `0${digits.slice(3)}`;
  }
  if (digits.length === 9) return `0${digits}`;
  if (digits.length === 10 && digits.startsWith('0')) return digits;
  if (digits.length === 10) return `0${digits}`;
  if (digits.length > 10) return `0${digits.slice(-9)}`;
  return digits;
}

export async function loadSmsConfigFromDb() {
  try {
    const { rows } = await pool.query(
      `SELECT value FROM system_settings WHERE key = $1 LIMIT 1`,
      [SMS_SETTINGS_KEY]
    );
    if (!rows.length) {
      runtimeSmsConfig = null;
      return null;
    }
    runtimeSmsConfig = JSON.parse(rows[0].value);
    return runtimeSmsConfig;
  } catch (error) {
    console.error('Failed to load SMS config:', error.message);
    runtimeSmsConfig = null;
    return null;
  }
}

export async function saveSmsConfig(input = {}) {
  const current = runtimeSmsConfig || {};
  const next = {
    provider: (input.provider || current.provider || 'intek').toLowerCase(),
    smsEnabled: input.smsEnabled !== undefined ? Boolean(input.smsEnabled) : current.smsEnabled !== false,
    intekApiKey:
      input.intekApiKey !== undefined && input.intekApiKey !== ''
        ? String(input.intekApiKey).trim()
        : current.intekApiKey || '',
    intekSender: input.intekSender !== undefined
      ? String(input.intekSender || 'mychurch').trim()
      : (current.intekSender || 'mychurch'),
    intekApiUrl: input.intekApiUrl !== undefined
      ? String(input.intekApiUrl || 'https://www.inteksms.top/api/v1').trim()
      : (current.intekApiUrl || 'https://www.inteksms.top/api/v1'),
    twilioAccountSid: input.twilioAccountSid !== undefined
      ? String(input.twilioAccountSid || '').trim()
      : (current.twilioAccountSid || ''),
    twilioAuthToken: input.twilioAuthToken !== undefined && input.twilioAuthToken !== ''
      ? String(input.twilioAuthToken).trim()
      : (current.twilioAuthToken || ''),
    twilioFromNumber: input.twilioFromNumber !== undefined
      ? String(input.twilioFromNumber || '').trim()
      : (current.twilioFromNumber || ''),
  };

  // Allow clearing key with explicit empty when clearApiKey flag set
  if (input.clearIntekApiKey) next.intekApiKey = '';
  if (input.clearTwilioAuthToken) next.twilioAuthToken = '';

  await pool.query(
    `INSERT INTO system_settings (key, value, updated_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
    [SMS_SETTINGS_KEY, JSON.stringify(next)]
  );

  runtimeSmsConfig = next;
  return next;
}

function dbOrEnv(dbVal, envVal) {
  if (dbVal !== undefined && dbVal !== null && String(dbVal).trim() !== '') return String(dbVal).trim();
  return envVal || '';
}

export function getMessagingConfig() {
  const db = runtimeSmsConfig || {};

  const intekApiKey = dbOrEnv(db.intekApiKey, process.env.INTEK_API_KEY);
  const intekSender = dbOrEnv(db.intekSender, process.env.INTEK_SENDER) || 'mychurch';
  const intekApiUrl = dbOrEnv(db.intekApiUrl, process.env.INTEK_API_URL) || 'https://www.inteksms.top/api/v1';
  const twilioAccountSid = dbOrEnv(db.twilioAccountSid, process.env.TWILIO_ACCOUNT_SID);
  const twilioAuthToken = dbOrEnv(db.twilioAuthToken, process.env.TWILIO_AUTH_TOKEN);
  const twilioFromNumber = dbOrEnv(db.twilioFromNumber, process.env.TWILIO_FROM_NUMBER);

  const intekConfigured = Boolean(intekApiKey);
  const twilioConfigured = Boolean(twilioAccountSid && twilioAuthToken && twilioFromNumber);

  let provider = (db.provider || process.env.MESSAGING_PROVIDER || '').toLowerCase();
  if (!provider || provider === 'auto') {
    provider = intekConfigured ? 'intek' : twilioConfigured ? 'twilio' : 'stub';
  }

  const smsEnabledEnv = process.env.SMS_ENABLED;
  const smsEnabled =
    db.smsEnabled !== undefined
      ? Boolean(db.smsEnabled)
      : smsEnabledEnv !== 'false';

  return {
    provider,
    smsEnabled,
    intekConfigured,
    twilioConfigured,
    ready:
      provider === 'stub' ||
      (provider === 'intek' && intekConfigured) ||
      (provider === 'twilio' && twilioConfigured),
    sender: provider === 'twilio' ? (twilioFromNumber || null) : (intekSender || null),
    apiUrl: intekApiUrl,
    // internal helpers used by send functions
    _secrets: {
      intekApiKey,
      intekSender,
      intekApiUrl,
      twilioAccountSid,
      twilioAuthToken,
      twilioFromNumber,
    },
  };
}

export function getPublicMessagingConfig() {
  const config = getMessagingConfig();
  const key = config._secrets.intekApiKey || '';
  return {
    provider: config.provider,
    smsEnabled: config.smsEnabled,
    intekConfigured: config.intekConfigured,
    twilioConfigured: config.twilioConfigured,
    ready: config.ready,
    sender: config.sender,
    apiUrl: config.apiUrl,
    hasIntekApiKey: Boolean(key),
    intekApiKeyMasked: key ? `${'*'.repeat(Math.max(0, key.length - 4))}${key.slice(-4)}` : '',
    intekSender: config._secrets.intekSender,
    intekApiUrl: config._secrets.intekApiUrl,
    hasTwilioAuthToken: Boolean(config._secrets.twilioAuthToken),
    twilioAccountSid: config._secrets.twilioAccountSid || '',
    twilioFromNumber: config._secrets.twilioFromNumber || '',
  };
}

export async function getIntekBalance() {
  const { _secrets: s, intekConfigured } = getMessagingConfig();
  if (!intekConfigured) return null;

  const apiUrl = s.intekApiUrl.replace(/\/$/, '');
  const response = await fetch(`${apiUrl}/balance`, {
    headers: {
      Authorization: `Bearer ${s.intekApiKey}`,
      Accept: 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok || !data.ok) return null;
  return data.data?.balance_units ?? null;
}

async function sendViaIntek({ to, body }) {
  const { _secrets: s } = getMessagingConfig();
  if (!s.intekApiKey) throw new Error('INTEK_API_KEY not configured');

  const recipient = formatSmsRecipient(to);
  if (recipient.length < 10) throw new Error('Invalid phone number for SMS');

  const apiUrl = s.intekApiUrl.replace(/\/$/, '');
  const sender = s.intekSender || 'mychurch';

  const response = await fetch(`${apiUrl}/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${s.intekApiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      message: body,
      recipients: [recipient],
      sender,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.error || data.message || `Intek SMS error ${response.status}`);
  }

  return {
    providerMessageId: String(data.data?.campaign_id || ''),
    status: data.data?.status === 'sent' ? 'sent' : 'queued',
  };
}

async function sendViaTwilio({ to, body }) {
  const { _secrets: s } = getMessagingConfig();
  if (!s.twilioAccountSid || !s.twilioAuthToken || !s.twilioFromNumber) {
    throw new Error('Twilio credentials not configured');
  }

  const auth = Buffer.from(`${s.twilioAccountSid}:${s.twilioAuthToken}`).toString('base64');
  const params = new URLSearchParams({
    To: to.startsWith('+') ? to : `+${to}`,
    From: s.twilioFromNumber,
    Body: body,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${s.twilioAccountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Twilio error ${response.status}`);
  }
  return { providerMessageId: data.sid, status: 'sent' };
}

async function deliverSms(outboxRow) {
  const config = getMessagingConfig();
  const recipient = outboxRow.recipient;

  if (config.provider === 'intek' && config.intekConfigured) {
    const result = await sendViaIntek({ to: recipient, body: outboxRow.body });
    await pool.query(
      `UPDATE message_outbox SET status = $1, provider_message_id = $2, sent_at = CURRENT_TIMESTAMP, error_message = NULL WHERE id = $3`,
      [result.status, result.providerMessageId, outboxRow.id]
    );
    return { ...outboxRow, status: result.status, provider_message_id: result.providerMessageId };
  }

  if (config.provider === 'twilio' && config.twilioConfigured) {
    const result = await sendViaTwilio({ to: recipient, body: outboxRow.body });
    await pool.query(
      `UPDATE message_outbox SET status = $1, provider_message_id = $2, sent_at = CURRENT_TIMESTAMP, error_message = NULL WHERE id = $3`,
      [result.status, result.providerMessageId, outboxRow.id]
    );
    return { ...outboxRow, status: result.status, provider_message_id: result.providerMessageId };
  }

  await pool.query(
    `UPDATE message_outbox SET status = 'stub', sent_at = CURRENT_TIMESTAMP, error_message = NULL WHERE id = $1`,
    [outboxRow.id]
  );
  return { ...outboxRow, status: 'stub' };
}

export async function sendSms({
  to,
  body,
  subject = null,
  referenceType = null,
  referenceId = null,
  sentBy = 'system',
}) {
  const config = getMessagingConfig();
  if (!config.smsEnabled) {
    throw new Error('SMS messaging is disabled. Enable it in Settings → SMS.');
  }

  const phone = formatSmsRecipient(to);
  if (phone.length < 10) {
    throw new Error('Invalid phone number');
  }

  const insert = await pool.query(
    `INSERT INTO message_outbox (channel, recipient, subject, body, status, provider, reference_type, reference_id, sent_by)
     VALUES ('sms', $1, $2, $3, 'queued', $4, $5, $6, $7) RETURNING *`,
    [phone, subject, body, config.provider, referenceType, referenceId, sentBy]
  );

  try {
    return await deliverSms(insert.rows[0]);
  } catch (error) {
    await pool.query(
      `UPDATE message_outbox SET status = 'failed', error_message = $1 WHERE id = $2`,
      [error.message, insert.rows[0].id]
    );
    throw error;
  }
}

export async function sendBulkSms({ recipients, body, subject, targetGroup, sentBy }) {
  const results = [];
  for (const recipient of recipients) {
    try {
      const row = await sendSms({
        to: recipient.phone,
        body,
        subject,
        referenceType: 'bulk',
        referenceId: recipient.id,
        sentBy,
      });
      results.push({
        memberId: recipient.id,
        memberName: recipient.name,
        phone: recipient.phone,
        status: row.status,
        outboxId: row.id,
      });
    } catch (error) {
      results.push({
        memberId: recipient.id,
        memberName: recipient.name,
        phone: recipient.phone,
        status: 'failed',
        error: error.message,
      });
    }
  }

  return {
    count: results.length,
    sent: results.filter(r => r.status === 'sent' || r.status === 'queued' || r.status === 'stub').length,
    results,
  };
}

export async function getSmsRecipients(targetGroup) {
  if (targetGroup === 'volunteers') {
    const result = await pool.query(`
      SELECT DISTINCT m.id, CONCAT(m.first_name, ' ', m.last_name) AS name, m.phone
      FROM members m
      JOIN volunteer_assignments va ON va.member_id = m.id
      WHERE LOWER(COALESCE(m.status, 'active')) = 'active'
        AND m.phone IS NOT NULL AND LENGTH(REGEXP_REPLACE(m.phone, '[^0-9]', '', 'g')) >= 7
    `);
    return result.rows;
  }

  const result = await pool.query(`
    SELECT id, CONCAT(first_name, ' ', last_name) AS name, phone
    FROM members
    WHERE LOWER(COALESCE(status, 'active')) = 'active'
      AND phone IS NOT NULL AND LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) >= 7
    ORDER BY last_name, first_name
  `);
  return result.rows;
}

export function buildVolunteerSmsReminder({ firstName, roleName, assignmentDate, eventTitle }) {
  const eventPart = eventTitle ? ` (${eventTitle})` : '';
  return `Hi ${firstName}, reminder: you're serving as ${roleName}${eventPart} on ${assignmentDate}. Thank you! - Liberty Assemblies of God`;
}
