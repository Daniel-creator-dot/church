import express from 'express';
import QRCode from 'qrcode';
import pool from '../db.js';
import { notifyCheckInPresence, notifyVipProgramAttendance } from '../services/smsNotifications.js';

const router = express.Router();

const VIP_PROGRAM_TITLE = "REV DR SAM ATO BENTIL Retirement & Send-Off";

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

async function ensureProgramGuestTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS program_guest_checkins (
      id SERIAL PRIMARY KEY,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      source VARCHAR(50) DEFAULT 'walk-in',
      member_id INTEGER REFERENCES members(id),
      notes TEXT,
      checkin_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
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

async function getOrCreateVipProgramEvent() {
  const existing = await pool.query(
    `SELECT id, title, event_date, event_time, location FROM events
     WHERE title ILIKE '%SAM ATO BENTIL%' OR title ILIKE '%Retirement%Send-Off%'
     ORDER BY id DESC LIMIT 1`
  );
  if (existing.rows.length) return existing.rows[0];

  const created = await pool.query(
    `INSERT INTO events (title, event_date, event_time, location, description)
     VALUES ($1, $2, '09:00', 'Main Sanctuary',
       'Retirement & Send-Off Celebration — VIP guest program attendance QR check-in')
     RETURNING id, title, event_date, event_time, location`,
    [VIP_PROGRAM_TITLE, todayISO()]
  );
  return created.rows[0];
}

async function syncProgramAttendance(event) {
  const today = event.event_date || todayISO();
  const serviceType = 'VIP Program — Retirement & Send-Off';
  const guestCount = await pool.query(
    'SELECT COUNT(*)::int AS c FROM program_guest_checkins WHERE event_id = $1',
    [event.id]
  );
  const headcount = guestCount.rows[0]?.c || 0;
  const memberIds = await pool.query(
    `SELECT DISTINCT member_id::text AS id FROM program_guest_checkins
     WHERE event_id = $1 AND member_id IS NOT NULL`,
    [event.id]
  );
  const attended = memberIds.rows.map((r) => r.id);

  const existing = await pool.query(
    `SELECT id FROM attendance_records WHERE service_date = $1 AND service_type = $2 LIMIT 1`,
    [today, serviceType]
  );
  if (existing.rows.length) {
    await pool.query(
      `UPDATE attendance_records
       SET headcount = $1, attended_member_ids = $2, notes = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [headcount, attended, `VIP program QR — ${headcount} present`, existing.rows[0].id]
    );
  } else {
    await pool.query(
      `INSERT INTO attendance_records (service_date, service_type, headcount, attended_member_ids, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [today, serviceType, headcount, attended, `VIP program QR — ${headcount} present`]
    );
  }
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

async function getMembersForHousehold(householdId) {
  return pool.query(
    `SELECT m.id, m.first_name, m.last_name, m.phone, m.household_id
     FROM members m
     WHERE m.household_id = $1 AND LOWER(COALESCE(m.status, 'active')) = 'active'
     ORDER BY m.first_name, m.last_name`,
    [householdId]
  );
}

async function buildLookupResponse(familyRows, householdMeta, event) {
  const checkedIn = await pool.query(
    'SELECT member_id FROM event_checkins WHERE event_id = $1',
    [event.id]
  );
  const checkedInSet = new Set(checkedIn.rows.map(r => r.member_id));

  return {
    householdName: householdMeta.name,
    familyCode: householdMeta.family_code || null,
    isRegisteredHousehold: Boolean(householdMeta.id),
    needsHouseholdSetup: !householdMeta.id,
    lookupMode: householdMeta.lookupMode || (householdMeta.id ? 'registered' : 'solo'),
    confirmRequired: Boolean(householdMeta.confirmRequired),
    surnameHint: householdMeta.surnameHint || null,
    primaryMemberId: familyRows[0]?.id,
    eventId: event.id,
    serviceDate: event.event_date,
    serviceTitle: event.title,
    checkedInToday: checkedIn.rows.length,
    members: familyRows.map(m => ({
      id: m.id,
      name: `${m.first_name} ${m.last_name}`.trim(),
      phone: m.phone,
      alreadyCheckedIn: checkedInSet.has(m.id),
      isSuggested: Boolean(m._isSuggested),
      isYou: Boolean(m._isYou),
    })),
  };
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

async function findMembersBySurname(lastName, excludeIds = []) {
  const trimmed = (lastName || '').trim();
  if (trimmed.length < 2) return { rows: [] };
  return pool.query(
    `SELECT m.id, m.first_name, m.last_name, m.phone, m.household_id
     FROM members m
     WHERE LOWER(COALESCE(m.status, 'active')) = 'active'
       AND LOWER(TRIM(m.last_name)) = LOWER($1)
       AND (CARDINALITY($2::int[]) = 0 OR NOT (m.id = ANY($2::int[])))
     ORDER BY m.first_name, m.last_name
     LIMIT 25`,
    [trimmed, excludeIds]
  );
}

async function buildSuggestedFamilyFromPhone(phoneMatches) {
  const byId = new Map();
  for (const m of phoneMatches) {
    byId.set(m.id, { ...m, _isYou: true, _isSuggested: false });
  }

  const primary = phoneMatches[0];
  const surnameMatches = await findMembersBySurname(primary.last_name, Array.from(byId.keys()));
  let hasSurnameSuggestions = false;

  for (const m of surnameMatches.rows) {
    if (!byId.has(m.id)) {
      byId.set(m.id, { ...m, _isYou: false, _isSuggested: true });
      hasSurnameSuggestions = true;
    }
  }

  return {
    members: Array.from(byId.values()),
    primary,
    hasSurnameSuggestions,
  };
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

// ---- VIP Program QR (Retirement & Send-Off attendance) ----
router.get('/vip-program-qr', async (req, res) => {
  try {
    await ensureProgramGuestTable();
    const event = await getOrCreateVipProgramEvent();
    const checkInUrl = `${getAppUrl()}/?view=vip-checkin`;
    const qrDataUrl = await QRCode.toDataURL(checkInUrl, {
      width: 420,
      margin: 2,
      color: { dark: '#1f2a1c', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    });
    const guestCount = await pool.query(
      'SELECT COUNT(*)::int AS c FROM program_guest_checkins WHERE event_id = $1',
      [event.id]
    );
    res.json({
      eventId: event.id,
      eventTitle: event.title,
      serviceDate: event.event_date,
      checkInUrl,
      qrDataUrl,
      checkedInCount: guestCount.rows[0]?.c || 0,
      memberCount: 0,
      guestCount: guestCount.rows[0]?.c || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/vip-program-stats', async (req, res) => {
  try {
    await ensureProgramGuestTable();
    const event = await getOrCreateVipProgramEvent();
    const guestCount = await pool.query(
      'SELECT COUNT(*)::int AS c FROM program_guest_checkins WHERE event_id = $1',
      [event.id]
    );
    const recent = await pool.query(
      `SELECT full_name AS name, phone, checkin_time, COALESCE(source, 'guest') AS kind
       FROM program_guest_checkins
       WHERE event_id = $1
       ORDER BY checkin_time DESC
       LIMIT 40`,
      [event.id]
    );
    res.json({
      eventId: event.id,
      eventTitle: event.title,
      serviceDate: event.event_date,
      checkedInCount: guestCount.rows[0]?.c || 0,
      recent: recent.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/vip-program', async (req, res) => {
  try {
    await ensureProgramGuestTable();
    const { full_name, phone } = req.body;
    const name = String(full_name || '').trim();
    const phoneNorm = normalizePhone(phone);

    if (name.length < 2) {
      return res.status(400).json({ error: 'Please enter your full name.' });
    }
    if (phoneNorm.length < 7) {
      return res.status(400).json({ error: 'Please enter a valid phone number.' });
    }

    const event = await getOrCreateVipProgramEvent();

    const alreadyGuest = await pool.query(
      `SELECT id FROM program_guest_checkins
       WHERE event_id = $1
         AND RIGHT(REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g'), 10) = $2
       LIMIT 1`,
      [event.id, phoneNorm]
    );
    if (alreadyGuest.rows.length) {
      return res.status(200).json({
        alreadyCheckedIn: true,
        message: 'You are already checked in for this program. Welcome!',
        eventTitle: event.title,
      });
    }

    const memberMatch = await pool.query(
      `SELECT id, first_name, last_name, phone FROM members
       WHERE LOWER(COALESCE(status, 'active')) = 'active'
         AND LENGTH(REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g')) >= 7
         AND RIGHT(REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g'), 10) = $1
       LIMIT 1`,
      [phoneNorm]
    );

    let memberId = null;
    if (memberMatch.rows.length) {
      memberId = memberMatch.rows[0].id;
      const existingMemberCi = await pool.query(
        'SELECT id FROM event_checkins WHERE event_id = $1 AND member_id = $2',
        [event.id, memberId]
      );
      if (!existingMemberCi.rows.length) {
        await pool.query(
          `INSERT INTO event_checkins (event_id, member_id, checked_in_by, family_tag)
           VALUES ($1, $2, 'vip-program-qr', 'vip-program')
           ON CONFLICT (event_id, member_id) DO UPDATE SET checkin_time = CURRENT_TIMESTAMP`,
          [event.id, memberId]
        );
      }
    }

    await pool.query(
      `INSERT INTO program_guest_checkins (event_id, full_name, phone, source, member_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        event.id,
        name,
        phone,
        memberId ? 'member' : 'guest',
        memberId,
        'VIP program QR attendance',
      ]
    );

    await syncProgramAttendance(event);
    notifyVipProgramAttendance({ name, phone });

    res.status(201).json({
      alreadyCheckedIn: false,
      message: `Welcome to ${event.title}! You are checked in.`,
      eventTitle: event.title,
      name,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lookup family: registered household first, then phone + surname suggestions (user confirms)
router.post('/lookup-family', async (req, res) => {
  try {
    const { phone, family_code } = req.body;
    const event = await getOrCreateSundayEvent();

    if (family_code) {
      const code = String(family_code).trim().toUpperCase();
      const hh = await pool.query(
        'SELECT * FROM households WHERE UPPER(family_code) = $1',
        [code]
      );
      if (!hh.rows.length) {
        return res.status(404).json({
          error: 'Family code not found. Check the code on your family card or visit the welcome desk.',
        });
      }
      const household = hh.rows[0];
      const members = await getMembersForHousehold(household.id);
      if (!members.rows.length) {
        return res.status(404).json({
          error: 'This household has no members yet. Ask staff to add your family under Households.',
        });
      }
      return res.json(await buildLookupResponse(members.rows, household, event));
    }

    const phoneNorm = normalizePhone(phone);
    if (phoneNorm.length < 7) {
      return res.status(400).json({ error: 'Please enter a valid phone number (at least 7 digits).' });
    }

    const byContactPhone = await pool.query(
      `SELECT * FROM households
       WHERE LENGTH(REGEXP_REPLACE(COALESCE(contact_phone, ''), '[^0-9]', '', 'g')) >= 7
         AND RIGHT(REGEXP_REPLACE(COALESCE(contact_phone, ''), '[^0-9]', '', 'g'), 10) = $1`,
      [phoneNorm]
    );
    if (byContactPhone.rows.length) {
      const household = byContactPhone.rows[0];
      const members = await getMembersForHousehold(household.id);
      if (members.rows.length) {
        return res.json(await buildLookupResponse(members.rows, household, event));
      }
    }

    const matches = await findMembersByPhone(phoneNorm);
    if (!matches.rows.length) {
      return res.status(404).json({
        error: 'Number not found. Use your family code, or visit the welcome desk to register.',
      });
    }

    const primary = matches.rows[0];
    if (primary.household_id) {
      const members = await getMembersForHousehold(primary.household_id);
      const hh = await pool.query('SELECT * FROM households WHERE id = $1', [primary.household_id]);
      const household = hh.rows[0] || { id: primary.household_id, name: primary.household_name || 'Your Household' };
      if (members.rows.length) {
        return res.json(await buildLookupResponse(members.rows, {
          ...household,
          lookupMode: 'registered',
          confirmRequired: false,
        }, event));
      }
    }

    const { members, primary: p, hasSurnameSuggestions } = await buildSuggestedFamilyFromPhone(matches.rows);
    return res.json(await buildLookupResponse(
      members,
      {
        id: null,
        name: hasSurnameSuggestions
          ? `${p.last_name} — confirm your family`
          : `${p.first_name} ${p.last_name}`,
        family_code: null,
        lookupMode: hasSurnameSuggestions ? 'suggested' : 'solo',
        confirmRequired: hasSurnameSuggestions,
        surnameHint: hasSurnameSuggestions ? p.last_name : null,
      },
      event
    ));
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

    await notifyCheckInPresence(member_ids, event_id, { onlyNew: true });

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

    await notifyCheckInPresence([member.rows[0].id], event_id, { onlyNew: true });

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
    await notifyCheckInPresence([member_id], event_id, { onlyNew: true });

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
