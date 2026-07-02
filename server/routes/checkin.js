import express from 'express';
import QRCode from 'qrcode';
import pool from '../db.js';

const router = express.Router();

function getAppUrl() {
  return process.env.APP_URL || process.env.VITE_APP_URL || 'https://church-ae7v.onrender.com';
}

function normalizePhone(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length <= 10) return digits;
  return digits.slice(-10);
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

async function getOrCreateSundayEvent() {
  const today = todayISO();
  const existing = await pool.query(
    `SELECT id, title, event_date FROM events
     WHERE event_date = $1 AND (title ILIKE '%sunday%' OR title ILIKE '%worship%')
     ORDER BY id DESC LIMIT 1`,
    [today]
  );
  if (existing.rows.length) return existing.rows[0];

  const created = await pool.query(
    `INSERT INTO events (title, event_date, event_time, location, description)
     VALUES ($1, $2, '09:00', 'Main Sanctuary', 'Weekly Sunday worship — QR family check-in')
     RETURNING id, title, event_date`,
    [`Sunday Worship — ${today}`, today]
  );
  return created.rows[0];
}

async function syncSundayAttendance(memberIds) {
  const today = todayISO();
  const idStrings = memberIds.map(String);
  const existing = await pool.query(
    `SELECT id, attended_member_ids, headcount FROM attendance_records
     WHERE service_date = $1 AND service_type ILIKE '%sunday%' LIMIT 1`,
    [today]
  );

  if (existing.rows.length) {
    const current = existing.rows[0].attended_member_ids || [];
    const merged = [...new Set([...current, ...idStrings])];
    await pool.query(
      `UPDATE attendance_records SET attended_member_ids = $1, headcount = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [merged, merged.length, existing.rows[0].id]
    );
  } else {
    await pool.query(
      `INSERT INTO attendance_records (service_date, service_type, headcount, attended_member_ids, notes)
       VALUES ($1, 'Sunday Service', $2, $3, 'QR family check-in')`,
      [today, idStrings.length, idStrings]
    );
  }
}

async function findMembersByPhone(phoneNorm) {
  return pool.query(
    `SELECT m.id, m.first_name, m.last_name, m.phone, m.household_id, m.email,
            h.name AS household_name
     FROM members m
     LEFT JOIN households h ON m.household_id = h.id
     WHERE LOWER(COALESCE(m.status, 'active')) = 'active'
       AND LENGTH(REGEXP_REPLACE(COALESCE(m.phone, ''), '[^0-9]', '', 'g')) >= 7
       AND RIGHT(REGEXP_REPLACE(COALESCE(m.phone, ''), '[^0-9]', '', 'g'), 10) = $1
     ORDER BY m.first_name, m.last_name`,
    [phoneNorm]
  );
}

async function getHouseholdMembers(householdId, phoneNorm) {
  if (householdId) {
    const hh = await pool.query(
      `SELECT m.id, m.first_name, m.last_name, m.phone, m.household_id
       FROM members m
       WHERE m.household_id = $1 AND LOWER(COALESCE(m.status, 'active')) = 'active'
       ORDER BY m.first_name, m.last_name`,
      [householdId]
    );
    if (hh.rows.length) return hh.rows;
  }
  return (await findMembersByPhone(phoneNorm)).rows;
}

// ---- Sunday QR (permanent — no event ID needed) ----
router.get('/sunday-qr', async (req, res) => {
  try {
    const event = await getOrCreateSundayEvent();
    const checkInUrl = `${getAppUrl()}/?view=sunday-checkin`;
    const qrDataUrl = await QRCode.toDataURL(checkInUrl, {
      width: 420,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    });
    const count = await pool.query(
      'SELECT COUNT(*)::int AS c FROM event_checkins WHERE event_id = $1',
      [event.id]
    );
    res.json({
      eventId: event.id,
      eventTitle: event.title,
      serviceDate: event.event_date,
      checkInUrl,
      qrDataUrl,
      checkedInCount: count.rows[0].c,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/sunday-stats', async (req, res) => {
  try {
    const event = await getOrCreateSundayEvent();
    const count = await pool.query(
      'SELECT COUNT(*)::int AS c FROM event_checkins WHERE event_id = $1',
      [event.id]
    );
    res.json({
      eventId: event.id,
      serviceDate: event.event_date,
      checkedInCount: count.rows[0].c,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lookup family by phone
router.post('/lookup-family', async (req, res) => {
  try {
    const phoneNorm = normalizePhone(req.body.phone);
    if (phoneNorm.length < 7) {
      return res.status(400).json({ error: 'Please enter a valid phone number (at least 7 digits).' });
    }

    const matches = await findMembersByPhone(phoneNorm);
    if (!matches.rows.length) {
      return res.status(404).json({
        error: 'We could not find your number. Please visit the welcome desk to register.',
      });
    }

    const primary = matches.rows[0];
    const familyRows = await getHouseholdMembers(primary.household_id, phoneNorm);
    const event = await getOrCreateSundayEvent();

    const checkedIn = await pool.query(
      'SELECT member_id FROM event_checkins WHERE event_id = $1',
      [event.id]
    );
    const checkedInSet = new Set(checkedIn.rows.map(r => r.member_id));

    const uniqueMembers = new Map();
    for (const m of familyRows) {
      uniqueMembers.set(m.id, m);
    }

    res.json({
      householdName: primary.household_name || `${primary.last_name} Family`,
      primaryMemberId: primary.id,
      eventId: event.id,
      serviceDate: event.event_date,
      serviceTitle: event.title,
      checkedInToday: checkedIn.rows.length,
      members: Array.from(uniqueMembers.values()).map(m => ({
        id: m.id,
        name: `${m.first_name} ${m.last_name}`.trim(),
        phone: m.phone,
        alreadyCheckedIn: checkedInSet.has(m.id),
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk family check-in
router.post('/family', async (req, res) => {
  try {
    const { event_id, member_ids } = req.body;
    if (!event_id || !member_ids?.length) {
      return res.status(400).json({ error: 'Select at least one family member.' });
    }

    const checkedIn = [];
    for (const memberId of member_ids) {
      const insert = await pool.query(
        `INSERT INTO event_checkins (event_id, member_id, checked_in_by, family_tag)
         VALUES ($1, $2, 'family-qr', 'family-checkin')
         ON CONFLICT (event_id, member_id) DO UPDATE SET checkin_time = CURRENT_TIMESTAMP
         RETURNING id, member_id`,
        [event_id, memberId]
      );
      if (insert.rows.length) checkedIn.push(insert.rows[0].member_id);
    }

    await syncSundayAttendance(checkedIn);

    const names = await pool.query(
      `SELECT id, first_name, last_name FROM members WHERE id = ANY($1::int[])`,
      [checkedIn]
    );

    res.status(201).json({
      count: checkedIn.length,
      members: names.rows.map(m => ({
        id: m.id,
        name: `${m.first_name} ${m.last_name}`.trim(),
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate QR code for event check-in (must be before /:id routes)
router.get('/qr/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await pool.query('SELECT id, title, event_date FROM events WHERE id = $1', [eventId]);
    if (!event.rows.length) return res.status(404).json({ error: 'Event not found' });

    const checkInUrl = `${getAppUrl()}/?view=checkin&event=${eventId}`;
    const qrDataUrl = await QRCode.toDataURL(checkInUrl, { width: 320, margin: 2, color: { dark: '#0d9488' } });
    const count = await pool.query('SELECT COUNT(*) FROM event_checkins WHERE event_id = $1', [eventId]);

    res.json({
      eventId,
      eventTitle: event.rows[0].title,
      eventDate: event.rows[0].event_date,
      checkInUrl,
      qrDataUrl,
      checkedInCount: parseInt(count.rows[0].count),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/public', async (req, res) => {
  try {
    const { event_id, email, family_tag } = req.body;
    if (!event_id || !email) {
      return res.status(400).json({ error: 'Event and email are required' });
    }

    const member = await pool.query(
      'SELECT id, first_name, last_name FROM members WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );
    if (!member.rows.length) {
      return res.status(404).json({ error: 'No member found with this email. Please contact the church office.' });
    }

    const insert = await pool.query(
      `INSERT INTO event_checkins (event_id, member_id, checked_in_by, family_tag)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (event_id, member_id) DO UPDATE SET checkin_time = CURRENT_TIMESTAMP, family_tag = EXCLUDED.family_tag
       RETURNING id`,
      [event_id, member.rows[0].id, 'self-checkin', family_tag || null]
    );

    const result = await pool.query(`
      SELECT ec.*, CONCAT(m.first_name, ' ', m.last_name) as member_name, m.email, e.title as event_title
      FROM event_checkins ec
      JOIN members m ON ec.member_id = m.id
      JOIN events e ON ec.event_id = e.id
      WHERE ec.id = $1
    `, [insert.rows[0].id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { event_id } = req.query;
    let query = `
      SELECT ec.*, CONCAT(m.first_name, ' ', m.last_name) as member_name, m.email, e.title as event_title
      FROM event_checkins ec
      JOIN members m ON ec.member_id = m.id
      JOIN events e ON ec.event_id = e.id
    `;
    const params = [];
    if (event_id) {
      query += ' WHERE ec.event_id = $1';
      params.push(event_id);
    }
    query += ' ORDER BY ec.checkin_time DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { event_id, member_id, checked_in_by, family_tag } = req.body;
    const insert = await pool.query(
      `INSERT INTO event_checkins (event_id, member_id, checked_in_by, family_tag)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (event_id, member_id) DO UPDATE SET checkin_time = CURRENT_TIMESTAMP
       RETURNING id`,
      [event_id, member_id, checked_in_by, family_tag]
    );
    const result = await pool.query(`
      SELECT ec.*, CONCAT(m.first_name, ' ', m.last_name) as member_name, m.email, e.title as event_title
      FROM event_checkins ec
      JOIN members m ON ec.member_id = m.id
      JOIN events e ON ec.event_id = e.id
      WHERE ec.id = $1
    `, [insert.rows[0].id]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/checkout', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE event_checkins SET checkout_time = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Check-in not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
