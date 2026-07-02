import pool from '../db.js';

function normalizePhone(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length <= 10) return digits;
  return digits.slice(-10);
}

export function getMessagingConfig() {
  const provider = (process.env.MESSAGING_PROVIDER || 'stub').toLowerCase();
  const twilioConfigured = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER
  );
  return {
    provider,
    smsEnabled: process.env.SMS_ENABLED !== 'false',
    twilioConfigured,
    ready: provider === 'stub' || (provider === 'twilio' && twilioConfigured),
    fromNumber: process.env.TWILIO_FROM_NUMBER || null,
  };
}

/**
 * Twilio integration hook — wire this when credentials are available.
 * Set MESSAGING_PROVIDER=twilio and TWILIO_* env vars on Render.
 */
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

  const phone = normalizePhone(to);
  if (phone.length < 7) {
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
      results.push({ memberId: recipient.id, memberName: recipient.name, phone: recipient.phone, status: row.status, outboxId: row.id });
    } catch (error) {
      results.push({ memberId: recipient.id, memberName: recipient.name, phone: recipient.phone, status: 'failed', error: error.message });
    }
  }

  return { count: results.length, sent: results.filter(r => r.status === 'sent' || r.status === 'stub').length, results };
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
