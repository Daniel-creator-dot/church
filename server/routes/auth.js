import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user by email
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, role, password FROM members WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check if user has a password (for backward compatibility with old plain text passwords)
    if (!user.password) {
      // For users without hashed passwords, check if the plain text matches (temporary backward compatibility)
      const plainTextResult = await pool.query(
        'SELECT id, first_name, last_name, email, role FROM members WHERE email = $1 AND password = $2',
        [email, password]
      );
      
      if (plainTextResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      const plainTextUser = plainTextResult.rows[0];
      res.json({
        success: true,
        user: {
          id: plainTextUser.id,
          email: plainTextUser.email,
          firstName: plainTextUser.first_name,
          lastName: plainTextUser.last_name,
          role: plainTextUser.role || 'Member'
        }
      });
      return;
    }

    // Verify password using bcrypt
    let isValid;
    try {
      isValid = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      console.error('Bcrypt comparison error:', bcryptError);
      return res.status(500).json({ error: 'Password verification failed' });
    }
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role || 'Member'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { first_name, last_name, email, password, phone, address, date_of_birth } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM members WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Use provided password or default
    const userPassword = password || 'zxcv123$$';
    
    // Hash password with lower cost for better compatibility
    const hashedPassword = await bcrypt.hash(userPassword, 8);

    // Create new user with default Member role
    const result = await pool.query(
      'INSERT INTO members (first_name, last_name, email, password, phone, address, date_of_birth, status, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, first_name, last_name, email, role',
      [first_name, last_name, email, hashedPassword, phone || null, address || null, date_of_birth || null, 'active', 'Member']
    );

    const user = result.rows[0];
    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      message: 'Registration successful. You can login with your email and the default password: zxcv123$$'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Forgot password endpoint - resets to default password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const userResult = await pool.query(
      'SELECT id, first_name, last_name, email FROM members WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      // For security, don't reveal that the email doesn't exist
      return res.json({ 
        success: true, 
        message: 'If an account with this email exists, the password has been reset to the default password: zxcv123$$' 
      });
    }

    const user = userResult.rows[0];

    // Reset password to default
    const defaultPassword = 'zxcv123$$';
    const hashedPassword = await bcrypt.hash(defaultPassword, 8);

    await pool.query(
      'UPDATE members SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
      [hashedPassword, email]
    );

    res.json({ 
      success: true, 
      message: 'Password has been reset to the default password: zxcv123$$',
      email: user.email
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin reset user password
router.post('/reset-password', async (req, res) => {
  try {
    const { adminEmail, adminPassword, userEmail, newPassword } = req.body;

    if (!adminEmail || !adminPassword || !userEmail) {
      return res.status(400).json({ error: 'Admin email, admin password, and user email are required' });
    }

    // Verify admin credentials
    const adminResult = await pool.query(
      'SELECT id, first_name, last_name, email, role, password FROM members WHERE email = $1',
      [adminEmail]
    );

    if (adminResult.rows.length === 0) {
      return res.status(401).json({ error: 'Admin not found' });
    }

    const admin = adminResult.rows[0];

    // Check if admin has proper role
    if (admin.role !== 'Admin' && admin.role !== 'Pastor') {
      return res.status(403).json({ error: 'Only admins and pastors can reset passwords' });
    }

    // Verify admin password
    if (admin.password) {
      const isValid = await bcrypt.compare(adminPassword, admin.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }
    } else {
      // Backward compatibility for plain text passwords
      const plainTextResult = await pool.query(
        'SELECT id FROM members WHERE email = $1 AND password = $2',
        [adminEmail, adminPassword]
      );
      
      if (plainTextResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }
    }

    // Reset user password
    const resetPassword = newPassword || 'zxcv123$$';
    const hashedPassword = await bcrypt.hash(resetPassword, 8);

    await pool.query(
      'UPDATE members SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
      [hashedPassword, userEmail]
    );

    res.json({ 
      success: true, 
      message: `Password for ${userEmail} has been reset to: ${resetPassword}`
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
