import express from 'express';
import pool from '../db.js';
import { notifyVipNominationThanks } from '../services/smsNotifications.js';
import { sendSms, syncIntekDeliveryStatus } from '../services/messaging.js';

const router = express.Router();

const VIP_FORM_TITLE = 'VIP Guest Nomination Questionnaire';
const VIP_FORM_DESCRIPTION =
  "Liberty Assemblies of God — REV DR SAM ATO BENTIL's Retirement & Send-Off Celebration. Nominate distinguished guests for official invitation.";

const VIP_FORM_FIELDS = [
  { label: 'Member Name', type: 'text', required: true },
  { label: 'Member Telephone/WhatsApp', type: 'text', required: true },
  { label: 'Member Ministry/Department/Group', type: 'text' },
  { label: 'Guest 1 Full Name', type: 'text', required: true },
  { label: 'Guest 1 Title/Position', type: 'text' },
  { label: 'Guest 1 Organization/Institution/Church', type: 'text' },
  { label: 'Guest 1 Category', type: 'text' },
  { label: 'Guest 1 Current Status/Position', type: 'text' },
  { label: 'Guest 1 Location/City/Country', type: 'text' },
  { label: 'Guest 1 Telephone', type: 'text' },
  { label: 'Guest 1 WhatsApp', type: 'text' },
  { label: 'Guest 1 Email', type: 'text' },
  { label: 'Guest 1 Office/Official Contact', type: 'text' },
  { label: 'Guest 1 Connection to REV DR SAM ATO BENTIL or Church', type: 'textarea' },
  { label: 'Guest 1 How well do you know them', type: 'text' },
  { label: 'Guest 1 Direct relationship/contact', type: 'text' },
  { label: 'Guest 1 Willing to assist introduction', type: 'text' },
  { label: 'Guest 1 Additional approach info', type: 'textarea' },
  { label: 'Guest 1 Invitation priority', type: 'text' },
  { label: 'Guest 1 Likely to attend', type: 'text' },
  { label: 'Guest 1 Request representative if unable', type: 'text' },
  { label: 'Other distinguished recommendations', type: 'textarea' },
  { label: 'Why recommend them', type: 'textarea' },
];

async function ensureVipForm() {
  const existing = await pool.query(
    'SELECT * FROM custom_forms WHERE title = $1 ORDER BY id ASC LIMIT 1',
    [VIP_FORM_TITLE]
  );
  if (existing.rows[0]) return existing.rows[0];

  const created = await pool.query(
    `INSERT INTO custom_forms (title, description, fields, is_public, is_anonymous)
     VALUES ($1, $2, $3, true, false) RETURNING *`,
    [VIP_FORM_TITLE, VIP_FORM_DESCRIPTION, JSON.stringify(VIP_FORM_FIELDS)]
  );
  return created.rows[0];
}

function parseResponses(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function phoneDigits(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function extractContactsFromSubmission(row) {
  const r = parseResponses(row.responses);
  const contacts = [];

  const memberPhone = r['Member Telephone/WhatsApp'] || '';
  if (phoneDigits(memberPhone).length >= 9) {
    contacts.push({
      key: `member-${row.id}`,
      kind: 'member',
      submissionId: row.id,
      name: row.submitter_name || r['Member Name'] || 'Member',
      phone: memberPhone,
      label: 'Nominator',
    });
  }

  for (let n = 1; n <= 4; n++) {
    const name = r[`Guest ${n} Full Name`];
    const phone = r[`Guest ${n} WhatsApp`] || r[`Guest ${n} Telephone`] || '';
    if (!name || !String(name).trim()) continue;
    if (phoneDigits(phone).length < 9) continue;
    contacts.push({
      key: `guest-${row.id}-${n}`,
      kind: 'guest',
      submissionId: row.id,
      guestIndex: n,
      name: String(name).trim(),
      phone,
      label: `Guest ${n}`,
      category: r[`Guest ${n} Category`] || '',
      priority: r[`Guest ${n} Invitation priority`] || '',
    });
  }

  return contacts;
}

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM custom_forms ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/vip-nomination', async (req, res) => {
  try {
    const form = await ensureVipForm();
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/vip-nomination', async (req, res) => {
  try {
    const form = await ensureVipForm();
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/vip-nomination/submissions', async (req, res) => {
  try {
    const form = await ensureVipForm();
    const result = await pool.query(
      `SELECT id, form_id, submitter_name, submitter_email, responses, submitted_at
       FROM form_submissions
       WHERE form_id = $1
       ORDER BY submitted_at DESC`,
      [form.id]
    );

    const submissions = result.rows.map((row) => {
      const responses = parseResponses(row.responses);
      const contacts = extractContactsFromSubmission(row);
      return {
        ...row,
        responses,
        contacts,
        guestCount: [1, 2, 3, 4].filter((n) => responses[`Guest ${n} Full Name`]).length,
      };
    });

    const allContacts = submissions.flatMap((s) => s.contacts);
    const manual = await loadManualContacts();

    res.json({
      formId: form.id,
      formTitle: form.title,
      count: submissions.length,
      contactCount: allContacts.length + manual.length,
      submissions,
      contacts: allContacts,
      manualContacts: manual,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const MANUAL_CONTACTS_KEY = 'vip_manual_contacts';

async function loadManualContacts() {
  const { rows } = await pool.query(
    `SELECT value FROM system_settings WHERE key = $1 LIMIT 1`,
    [MANUAL_CONTACTS_KEY]
  );
  if (!rows.length) return [];
  try {
    const parsed = JSON.parse(rows[0].value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveManualContacts(list) {
  await pool.query(
    `INSERT INTO system_settings (key, value, updated_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
    [MANUAL_CONTACTS_KEY, JSON.stringify(list)]
  );
  return list;
}

router.get('/vip-nomination/contacts', async (req, res) => {
  try {
    const contacts = await loadManualContacts();
    res.json({ contacts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/vip-nomination/contacts', async (req, res) => {
  try {
    const { name, phone, note, contacts: bulk } = req.body || {};
    const existing = await loadManualContacts();
    const added = [];

    const pushOne = (rawName, rawPhone, rawNote = '') => {
      const phoneVal = String(rawPhone || '').trim();
      const nameVal = String(rawName || '').trim() || 'Contact';
      if (phoneDigits(phoneVal).length < 9) return null;
      const key = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const item = {
        key,
        kind: 'manual',
        name: nameVal,
        phone: phoneVal,
        label: 'Added',
        note: String(rawNote || '').trim(),
        createdAt: new Date().toISOString(),
      };
      // skip exact phone duplicates
      if (existing.some((c) => phoneDigits(c.phone) === phoneDigits(phoneVal))) {
        return { ...item, duplicate: true };
      }
      existing.push(item);
      added.push(item);
      return item;
    };

    if (Array.isArray(bulk) && bulk.length) {
      for (const row of bulk) {
        pushOne(row.name, row.phone, row.note);
      }
    } else {
      const one = pushOne(name, phone, note);
      if (!one) return res.status(400).json({ error: 'Valid name and phone (at least 9 digits) required' });
      if (one.duplicate) return res.status(409).json({ error: 'That phone number is already in your contact list' });
    }

    await saveManualContacts(existing);
    res.status(201).json({
      success: true,
      added,
      contacts: existing,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/vip-nomination/contacts/:key', async (req, res) => {
  try {
    const existing = await loadManualContacts();
    const next = existing.filter((c) => c.key !== req.params.key);
    await saveManualContacts(next);
    res.json({ success: true, contacts: next });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/vip-nomination/sms', async (req, res) => {
  try {
    const { message, recipients, sent_by: sentBy } = req.body || {};
    const body = String(message || '')
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    if (!body) return res.status(400).json({ error: 'message is required' });
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Select at least one recipient' });
    }

    // Dedupe by phone digits so the same number is not blasted repeatedly
    const seen = new Set();
    const uniqueRecipients = [];
    for (const recipient of recipients) {
      const digits = String(recipient.phone || '').replace(/\D/g, '');
      if (!digits || seen.has(digits)) continue;
      seen.add(digits);
      uniqueRecipients.push(recipient);
    }

    const results = [];
    for (let i = 0; i < uniqueRecipients.length; i++) {
      const recipient = uniqueRecipients[i];
      if (i > 0) {
        await new Promise((r) => setTimeout(r, 1000));
      }
      const phone = recipient.phone;
      const name = recipient.name || 'Friend';
      const personalized = body
        .replaceAll('{{name}}', name.split(' ')[0] || name)
        .replaceAll('{{fullName}}', name);

      try {
        const row = await sendSms({
          to: phone,
          body: personalized,
          subject: 'VIP nomination SMS',
          referenceType: 'vip_nomination_sms',
          referenceId: recipient.submissionId || null,
          sentBy: sentBy || 'forms',
        });
        results.push({
          key: recipient.key,
          name,
          phone: row.recipient || phone,
          status: row.status,
          outboxId: row.id,
          campaignId: row.provider_message_id || null,
        });
      } catch (error) {
        results.push({
          key: recipient.key,
          name,
          phone,
          status: 'failed',
          error: error.message,
        });
      }
    }

    // Give Intek a moment, then refresh delivery reports
    await new Promise((r) => setTimeout(r, 2500));
    const sync = await syncIntekDeliveryStatus(40);

    const sent = results.filter((r) =>
      ['sent', 'queued', 'stub', 'submitted', 'delivered'].includes(r.status)
    ).length;
    res.json({
      success: true,
      count: results.length,
      sent,
      failed: results.length - sent,
      dedupedFrom: recipients.length,
      deliverySync: sync,
      tip: 'Intek may show Submitted/Sent before Delivered. Check SMS Outbox delivery status, and avoid long messages with many links.',
      results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, fields, is_public, is_anonymous } = req.body;
    const result = await pool.query(
      `INSERT INTO custom_forms (title, description, fields, is_public, is_anonymous)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, description, JSON.stringify(fields || []), is_public, is_anonymous]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/submissions', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM form_submissions WHERE form_id = $1 ORDER BY submitted_at DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/submit', async (req, res) => {
  try {
    const { submitter_name, submitter_email, responses } = req.body;
    const result = await pool.query(
      `INSERT INTO form_submissions (form_id, submitter_name, submitter_email, responses)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.id, submitter_name, submitter_email, JSON.stringify(responses || {})]
    );

    const form = await pool.query('SELECT title FROM custom_forms WHERE id = $1', [req.params.id]);
    if (form.rows[0]?.title === VIP_FORM_TITLE) {
      const phone = responses?.['Member Telephone/WhatsApp'] || null;
      notifyVipNominationThanks({
        name: submitter_name || responses?.['Member Name'],
        phone,
      });
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
