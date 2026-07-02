import pool from './db.js';

async function addAdminUser() {
  try {
    console.log('Adding admin user to database...');

    // Add password and role columns if they don't exist
    try {
      await pool.query('ALTER TABLE members ADD COLUMN IF NOT EXISTS password VARCHAR(255)');
      console.log('Added password column');
    } catch (err) {
      console.log('Password column might already exist:', err.message);
    }

    try {
      await pool.query('ALTER TABLE members ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT \'Member\'');
      console.log('Added role column');
    } catch (err) {
      console.log('Role column might already exist:', err.message);
    }

    // Check if admin user already exists
    const existingAdmin = await pool.query(
      'SELECT id FROM members WHERE email = $1',
      ['admin@church.org']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('Admin user already exists, updating password and role...');
      await pool.query(
        'UPDATE members SET password = $1, role = $2 WHERE email = $3',
        ['admin123', 'Admin', 'admin@church.org']
      );
      console.log('Updated existing admin user');
    } else {
      // Insert new admin user
      await pool.query(
        'INSERT INTO members (first_name, last_name, email, password, role, status) VALUES ($1, $2, $3, $4, $5, $6)',
        ['Admin', 'User', 'admin@church.org', 'admin123', 'Admin', 'active']
      );
      console.log('Created new admin user');
    }

    console.log('\n✅ Admin user setup complete!');
    console.log('Email: admin@church.org');
    console.log('Password: admin123');
    console.log('Role: Admin');

    await pool.end();
  } catch (error) {
    console.error('Error adding admin user:', error);
    process.exit(1);
  }
}

addAdminUser();
