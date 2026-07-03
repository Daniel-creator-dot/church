import pool from '../db.js';

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

export function getMessagingConfig() {
  const intekConfigured = Boolean(process.env.INTEK_API_KEY);
  const twilioConfigured = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER
  );

  let provider = (process.env.MESSAGING_PROVIDER || '').toLowerCase();
  if (!provider || provider === 'auto') {
    provider = intekConfigured ? 'intek' : twilioConfigured ? 'twilio' : 'stub';
  }

  return {
    provider,
    smsEnabled: process.env.SMS_ENABLED !== 'false',
    intekConfigured,
    twilioConfigured,
    ready:
      provider === 'stub' ||
      (provider === 'intek' && intekConfigured) ||
      (provider === 'twilio' && twilioConfigured),
    sender: process.env.INTEK_SENDER || process.env.TWILIO_FROM_NUMBER || null,
    apiUrl: process.env.INTEK_API_URL || 'https://www.inteksms.top/api/v1',
  };
}

export async function getIntekBalance() {
  const apiKey = process.env.INTEK_API_KEY;
  const apiUrl = (process.env.INTEK_API_URL || 'https://www.inteksms.top/api/v1').replace(/\/$/, '');
  if (!apiKey) return null;

  const response = await fetch(`${apiUrl}/balance`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok || !data.ok) return null;
  return data.data?.balance_units ?? null;
}

async function sendViaIntek({ to, body }) {
  const apiKey = process.env.INTEK_API_KEY;
  const apiUrl = (process.env.INTEK_API_URL || 'https://www.inteksms.top/api/v1').replace(/\/$/, '');
  const sender = process.env.INTEK_SENDER || 'mychurch';

  if (!apiKey) throw new Error('INTEK_API_KEY not configured');

  const recipient = formatSmsRecipient(to);
  if (recipient.length < 10) throw new Error('Invalid phone number for SMS');

  const response = await fetch(`${apiUrl}/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    throw new Error('Twilio credentials not configured');
  }

  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
  const params = new URLSearchParams({
    To: to.startsWith('+') ? to : `+${to}`,
    From: TWILIO_FROM_NUMBER,
    Body: body,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
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
    throw new Error('SMS messaging is disabled. Set SMS_ENABLED=true to enable.');
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
  return `Hi ${firstName}, reminder: you're serving as ${roleName}${eventPart} on ${assignmentDate}. Thank you! - Bethel Baptist Church`;
}
