import express from 'express';
import pool from '../db.js';
import { sendBulkSms, getSmsRecipients } from '../services/messaging.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, m.name as ministry_name
      FROM communications c
      LEFT JOIN ministries m ON c.ministry_id = m.id
      ORDER BY c.sent_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { subject, body, channel, target_group, ministry_id, sent_by } = req.body;
    const msgChannel = channel || 'email';
    const targetGroup = target_group || 'all';

    if (msgChannel === 'sms') {
      const recipients = await getSmsRecipients(targetGroup);
      if (!recipients.length) {
        return res.status(400).json({ error: 'No members with phone numbers found for this group.' });
      }

      const comm = await pool.query(
        `INSERT INTO communications (subject, body, channel, target_group, ministry_id, status, sent_by)
         VALUES ($1, $2, 'sms', $3, $4, 'Queued', $5) RETURNING *`,
        [subject || 'SMS Broadcast', body, targetGroup, ministry_id, sent_by || 'system']
      );

      const result = await sendBulkSms({
        recipients,
        body: body || subject,
        subject: subject || 'Church SMS',
        targetGroup,
        sentBy: sent_by || 'system',
      });

      await pool.query(
        `UPDATE communications SET status = $1 WHERE id = $2`,
        [result.sent > 0 ? 'Queued' : 'Failed', comm.rows[0].id]
      );

      return res.status(201).json({ ...comm.rows[0], bulkResult: result });
    }

    const result = await pool.query(
      `INSERT INTO communications (subject, body, channel, target_group, ministry_id, sent_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [subject, body, msgChannel, targetGroup, ministry_id, sent_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
