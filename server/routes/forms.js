import express from 'express';
import pool from '../db.js';
import { notifyVipNominationThanks } from '../services/smsNotifications.js';

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
    res.json({
      formId: form.id,
      formTitle: form.title,
      count: result.rows.length,
      submissions: result.rows,
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
