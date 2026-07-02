import express from 'express';
import pool from '../db.js';

const router = express.Router();

function normalizePhone(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length <= 10) return digits;
  return digits.slice(-10);
}

function generateFamilyCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `BBC-${suffix}`;
}

async function uniqueFamilyCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateFamilyCode();
    const exists = await pool.query('SELECT id FROM households WHERE family_code = $1', [code]);
    if (!exists.rows.length) return code;
  }
  return `BBC-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT h.*,
        CONCAT(pm.first_name, ' ', pm.last_name) AS primary_member_name,
        (SELECT COUNT(*)::int FROM members m WHERE m.household_id = h.id) AS member_count
      FROM households h
      LEFT JOIN members pm ON h.primary_member_id = pm.id
      ORDER BY h.name ASC
    `);

    for (const row of result.rows) {
      if (!row.family_code) {
        const code = await uniqueFamilyCode();
        await pool.query('UPDATE households SET family_code = $1 WHERE id = $2', [code, row.id]);
        row.family_code = code;
      }
    }

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/unassigned-members', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, first_name, last_name, phone, email
      FROM members
      WHERE household_id IS NULL AND LOWER(COALESCE(status, 'active')) = 'active'
      ORDER BY last_name, first_name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, address, primary_member_id, contact_phone } = req.body;
    const family_code = await uniqueFamilyCode();
    const phoneNorm = contact_phone ? normalizePhone(contact_phone) : null;

    const result = await pool.query(
      `INSERT INTO households (name, address, primary_member_id, contact_phone, family_code)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, address, primary_member_id || null, phoneNorm, family_code]
    );

    const household = result.rows[0];

    if (primary_member_id) {
      await pool.query('UPDATE members SET household_id = $1 WHERE id = $2', [household.id, primary_member_id]);
    }

    res.status(201).json(household);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/members', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, phone, email, household_id
       FROM members WHERE household_id = $1 ORDER BY first_name, last_name`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/members', async (req, res) => {
  try {
    const { member_id } = req.body;
    if (!member_id) return res.status(400).json({ error: 'member_id required' });

    await pool.query('UPDATE members SET household_id = $1 WHERE id = $2', [req.params.id, member_id]);
    const member = await pool.query('SELECT * FROM members WHERE id = $1', [member_id]);
    res.status(201).json(member.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id/members/:memberId', async (req, res) => {
  try {
    await pool.query(
      'UPDATE members SET household_id = NULL WHERE id = $1 AND household_id = $2',
      [req.params.memberId, req.params.id]
    );
    res.json({ message: 'Member removed from household' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, address, primary_member_id, contact_phone } = req.body;
    const phoneNorm = contact_phone !== undefined ? (contact_phone ? normalizePhone(contact_phone) : null) : undefined;

    const result = await pool.query(
      `UPDATE households SET
         name = COALESCE($1, name),
         address = COALESCE($2, address),
         primary_member_id = COALESCE($3, primary_member_id),
         contact_phone = COALESCE($4, contact_phone)
       WHERE id = $5 RETURNING *`,
      [name, address, primary_member_id, phoneNorm, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Household not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/regenerate-code', async (req, res) => {
  try {
    const code = await uniqueFamilyCode();
    const result = await pool.query(
      'UPDATE households SET family_code = $1 WHERE id = $2 RETURNING *',
      [code, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Household not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
