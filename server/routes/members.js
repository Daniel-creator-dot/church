import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// Get all members
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM members ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get member by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM members WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new member
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, address, date_of_birth, status, role, password } = req.body;
    
    // Use default password if none provided
    const defaultPassword = password || 'zxcv123$$';
    
    // Hash password with lower cost for better compatibility
    const hashedPassword = await bcrypt.hash(defaultPassword, 8);
    
    const result = await pool.query(
      'INSERT INTO members (first_name, last_name, email, phone, address, date_of_birth, status, role, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [first_name, last_name, email, phone, address, date_of_birth, status || 'active', role || 'Member', hashedPassword]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update member
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, address, date_of_birth, status, role, password } = req.body;
    
    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 8);
    }
    
    // Build dynamic query based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (first_name !== undefined) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(first_name);
    }
    if (last_name !== undefined) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(last_name);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramCount++}`);
      values.push(address);
    }
    if (date_of_birth !== undefined) {
      updates.push(`date_of_birth = $${paramCount++}`);
      values.push(date_of_birth);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (role !== undefined) {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }
    if (password !== undefined) {
      updates.push(`password = $${paramCount++}`);
      values.push(hashedPassword);
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `UPDATE members SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete member
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM members WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update member password
router.put('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    // Get current member
    const memberResult = await pool.query('SELECT * FROM members WHERE id = $1', [id]);
    if (memberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    const member = memberResult.rows[0];
    
    // If member has a password, verify current password
    if (member.password) {
      const isValid = await bcrypt.compare(currentPassword, member.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }
    
    // Hash new password with lower cost for better compatibility
    const hashedPassword = await bcrypt.hash(newPassword, 8);
    
    // Update password
    await pool.query(
      'UPDATE members SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, id]
    );
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
