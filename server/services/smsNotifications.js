import pool from '../db.js';
import { sendSms, getMessagingConfig, buildVolunteerSmsReminder } from './messaging.js';

const CHURCH = process.env.CHURCH_NAME || 'Liberty Assemblies of God';

function formatServiceDate(dateStr) {
  if (!dateStr) return 'today';
  try {
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

function dispatchSms({ to, body, subject, referenceType, referenceId, sentBy = 'system' }) {
  const config = getMessagingConfig();
  if (!config.smsEnabled || !to) return;

  sendSms({ to, body, subject, referenceType, referenceId, sentBy }).catch((err) => {
    console.error(`[SMS ${referenceType}]`, err.message);
  });
}

export async function notifyCheckInPresence(memberIds, eventId, { onlyNew = true } = {}) {
  if (!memberIds?.length || !eventId) return;

  let ids = memberIds;
  if (onlyNew) {
    const existing = await pool.query(
      'SELECT member_id FROM event_checkins WHERE event_id = $1 AND member_id = ANY($2::int[])',
      [eventId, memberIds]
    );
    const already = new Set(existing.rows.map(r => r.member_id));
    ids = memberIds.filter(id => !already.has(id));
    if (!ids.length) return;
  }

  const [eventRes, membersRes] = await Promise.all([
    pool.query('SELECT title, event_date, event_time, location FROM events WHERE id = $1', [eventId]),
    pool.query(
      'SELECT id, first_name, last_name, phone FROM members WHERE id = ANY($1::int[])',
      [ids]
    ),
  ]);

  const event = eventRes.rows[0];
  if (!event) return;

  const when = formatServiceDate(event.event_date);
  const where = event.location ? ` Location: ${event.location}.` : '';

  for (const m of membersRes.rows) {
    if (!m.phone) continue;
    dispatchSms({
      to: m.phone,
      subject: `Present: ${event.title}`,
      referenceType: 'checkin',
      referenceId: m.id,
      body: `Hi ${m.first_name}, you're checked in for ${event.title} on ${when}.${where} Welcome to worship! - ${CHURCH}`,
    });
  }
}

export async function notifyEventRegistration(memberId, eventId) {
  const [eventRes, memberRes] = await Promise.all([
    pool.query('SELECT title, event_date, event_time, location FROM events WHERE id = $1', [eventId]),
    pool.query('SELECT id, first_name, phone FROM members WHERE id = $1', [memberId]),
  ]);

  const event = eventRes.rows[0];
  const member = memberRes.rows[0];
  if (!event || !member?.phone) return;

  const when = formatServiceDate(event.event_date);
  const time = event.event_time ? ` at ${event.event_time}` : '';
  const where = event.location ? ` Venue: ${event.location}.` : '';

  dispatchSms({
    to: member.phone,
    subject: `Registered: ${event.title}`,
    referenceType: 'event_registration',
    referenceId: member.id,
    body: `Hi ${member.first_name}, you're registered for ${event.title} on ${when}${time}.${where} See you there! - ${CHURCH}`,
  });
}

export function notifyVisitorWelcome({ name, phone }) {
  if (!phone) return;
  const first = (name || 'friend').split(' ')[0];
  dispatchSms({
    to: phone,
    subject: 'Welcome visitor',
    referenceType: 'visitor',
    body: `Hi ${first}, thank you for visiting ${CHURCH}! We're glad you came. Someone from our team will follow up with you soon. God bless!`,
  });
}

export function notifyMemberWelcome({ first_name, phone }) {
  if (!phone) return;
  dispatchSms({
    to: phone,
    subject: 'Welcome to church',
    referenceType: 'member_welcome',
    body: `Welcome to ${CHURCH}, ${first_name}! Your registration is complete. We're blessed to have you in our family.`,
  });
}

export async function notifyVolunteerScheduled(assignmentId) {
  const result = await pool.query(`
    SELECT va.*, m.first_name, m.phone, e.title AS event_title
    FROM volunteer_assignments va
    JOIN members m ON va.member_id = m.id
    LEFT JOIN events e ON va.event_id = e.id
    WHERE va.id = $1
  `, [assignmentId]);

  const row = result.rows[0];
  if (!row?.phone) return;

  dispatchSms({
    to: row.phone,
    subject: `Volunteer: ${row.role_name}`,
    referenceType: 'volunteer_assignment',
    referenceId: assignmentId,
    body: buildVolunteerSmsReminder({
      firstName: row.first_name,
      roleName: row.role_name,
      assignmentDate: row.assignment_date,
      eventTitle: row.event_title,
    }),
  });
}

export async function notifyFollowUpCreated(followUpId) {
  const result = await pool.query(`
    SELECT f.*, m.first_name, m.phone
    FROM follow_ups f
    LEFT JOIN members m ON f.target_person_id = m.id
    WHERE f.id = $1
  `, [followUpId]);

  const row = result.rows[0];
  if (!row?.phone) return;

  dispatchSms({
    to: row.phone,
    subject: 'Follow-up from church',
    referenceType: 'follow_up',
    referenceId: followUpId,
    body: `Hi ${row.first_name}, ${CHURCH} will be in touch with you soon regarding ${row.category || 'your visit'}. We're here for you!`,
  });
}

export async function notifyGroupJoin(groupId, memberId) {
  const [groupRes, memberRes] = await Promise.all([
    pool.query('SELECT name, meeting_day, meeting_time FROM small_groups WHERE id = $1', [groupId]),
    pool.query('SELECT first_name, phone FROM members WHERE id = $1', [memberId]),
  ]);

  const group = groupRes.rows[0];
  const member = memberRes.rows[0];
  if (!group || !member?.phone) return;

  const schedule = group.meeting_day
    ? ` Meets ${group.meeting_day}${group.meeting_time ? ` ${group.meeting_time}` : ''}.`
    : '';

  dispatchSms({
    to: member.phone,
    subject: `Group: ${group.name}`,
    referenceType: 'group_join',
    referenceId: memberId,
    body: `Hi ${member.first_name}, you've joined ${group.name} at ${CHURCH}.${schedule} Welcome!`,
  });
}

export async function notifyPrayerReceived(prayerId) {
  const result = await pool.query(
    'SELECT submitted_by, email FROM prayer_requests WHERE id = $1',
    [prayerId]
  );
  const prayer = result.rows[0];
  if (!prayer) return;

  let phone = null;
  let firstName = (prayer.submitted_by || 'friend').split(' ')[0];

  if (prayer.email) {
    const member = await pool.query(
      'SELECT first_name, phone FROM members WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [prayer.email]
    );
    if (member.rows[0]?.phone) {
      phone = member.rows[0].phone;
      firstName = member.rows[0].first_name || firstName;
    }
  }

  if (!phone) return;

  dispatchSms({
    to: phone,
    subject: 'Prayer request received',
    referenceType: 'prayer',
    referenceId: prayerId,
    body: `Hi ${firstName}, we received your prayer request at ${CHURCH}. Our prayer team is lifting you up. God bless you.`,
  });
}

export async function notifyDonationReceived(donationId) {
  const result = await pool.query(`
    SELECT d.amount, d.donation_date, m.first_name, m.phone
    FROM donations d
    LEFT JOIN members m ON d.member_id = m.id
    WHERE d.id = $1
  `, [donationId]);

  const row = result.rows[0];
  if (!row?.phone) return;

  dispatchSms({
    to: row.phone,
    subject: 'Thank you for giving',
    referenceType: 'donation',
    referenceId: donationId,
    body: `Thank you ${row.first_name} for your generous gift to ${CHURCH}. May God bless you abundantly!`,
  });
}

export function notifyVipNominationThanks({ name, phone }) {
  if (!phone) return;
  const first = (name || 'friend').split(' ')[0];
  const appUrl = process.env.APP_URL || process.env.VITE_APP_URL || 'https://church-ae7v.onrender.com';
  dispatchSms({
    to: phone,
    subject: 'VIP nomination received',
    referenceType: 'vip_nomination',
    body: `Hi ${first}, thank you for submitting your VIP guest nomination for REV DR SAM ATO BENTIL's Retirement & Send-Off. ${CHURCH} appreciates you. On the program day, scan the church QR to mark your attendance: ${appUrl}/?view=vip-checkin God bless you!`,
  });
}

export function notifyVipProgramAttendance({ name, phone }) {
  if (!phone) return;
  const first = (name || 'friend').split(' ')[0];
  dispatchSms({
    to: phone,
    subject: 'Program attendance confirmed',
    referenceType: 'vip_program_checkin',
    body: `Hi ${first}, welcome! You're checked in for REV DR SAM ATO BENTIL's Retirement & Send-Off at ${CHURCH}. We're glad you came. God bless you!`,
  });
}

export const SMS_TRIGGERS = [
  'Sunday / event check-in (when present)',
  'Event registration (RSVP)',
  'First-time visitor signup',
  'New member registration',
  'Volunteer scheduled',
  'Follow-up assigned',
  'Small group join',
  'Prayer request received',
  'Donation recorded (member with phone)',
  'VIP guest nomination thank-you',
  'VIP program QR attendance',
  'Volunteer SMS reminders (manual)',
  'Bulk SMS (Communications)',
];
