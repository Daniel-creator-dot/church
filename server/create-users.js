import pool from './db.js';
import bcrypt from 'bcrypt';

async function createUsers() {
  try {
    console.log('Creating users with different roles...');

    // First, check if we need to add the role and password columns
    try {
      await pool.query('ALTER TABLE members ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT \'Member\'');
      await pool.query('ALTER TABLE members ADD COLUMN IF NOT EXISTS password VARCHAR(255)');
      console.log('Ensured role and password columns exist');
    } catch (error) {
      console.log('Columns might already exist:', error.message);
    }

    // Create users with different roles
    const users = [
      {
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@church.org',
        phone: '+233 24 000 0001',
        address: 'Church Office',
        role: 'Admin',
        password: 'admin123'
      },
      {
        first_name: 'Senior',
        last_name: 'Pastor',
        email: 'pastor@church.org',
        phone: '+233 24 000 0002',
        address: 'Church Parsonage',
        role: 'Pastor',
        password: 'pastor123'
      },
      {
        first_name: 'David',
        last_name: 'Nkansah',
        email: 'dnkansah29@gmail.com',
        phone: '+233 24 123 4567',
        address: 'Accra, Ghana',
        role: 'Admin',
        password: 'david123'
      },
      {
        first_name: 'Sarah',
        last_name: 'Jenkins',
        email: 'sarah.j@morningchurch.org',
        phone: '+1 (555) 234-5678',
        address: 'Northside District',
        role: 'Member',
        password: 'sarah123'
      },
      {
        first_name: 'James',
        last_name: 'Taylor',
        email: 'james.t@gmail.com',
        phone: '+1 (555) 876-5432',
        address: 'Downtown Boulevard',
        role: 'Member',
        password: 'james123'
      },
      {
        first_name: 'Mary',
        last_name: 'Mensah',
        email: 'mary.mensah@hotmail.com',
        phone: '+233 27 555 1212',
        address: 'Tema, Ghana',
        role: 'Member',
        password: 'mary123'
      },
      {
        first_name: 'Mark',
        last_name: 'Robertson',
        email: 'mark.rob@gmail.com',
        phone: '+1 (555) 432-1098',
        address: 'Eastside Suburbs',
        role: 'Member',
        password: 'mark123'
      },
      {
        first_name: 'Patricia',
        last_name: 'Alabi',
        email: 'pat.alabi@yahoo.com',
        phone: '+234 803 123 4567',
        address: 'Lagos, Nigeria',
        role: 'Member',
        password: 'patricia123'
      },
      {
        first_name: 'Samuel',
        last_name: 'Owusu',
        email: 'sowusu@outlook.com',
        phone: '+233 20 987 6543',
        address: 'Kumasi, Ghana',
        role: 'Member',
        password: 'samuel123'
      }
    ];

    for (const user of users) {
      // Hash password with lower cost for better compatibility
      const hashedPassword = await bcrypt.hash(user.password, 8);
      
      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT id FROM members WHERE email = $1',
        [user.email]
      );

      if (existingUser.rows.length > 0) {
        // Update existing user with role and hashed password
        await pool.query(
          'UPDATE members SET role = $1, password = $2 WHERE email = $3',
          [user.role, hashedPassword, user.email]
        );
        console.log(`Updated existing user: ${user.email} (${user.role})`);
      } else {
        // Insert new user with hashed password
        await pool.query(
          'INSERT INTO members (first_name, last_name, email, phone, address, role, password, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [user.first_name, user.last_name, user.email, user.phone, user.address, user.role, hashedPassword, 'active']
        );
        console.log(`Created new user: ${user.email} (${user.role})`);
      }
    }

    console.log('\n=== User Creation Complete ===');
    console.log('\nLogin Credentials:');
    console.log('=====================');
    users.forEach(user => {
      console.log(`${user.role}: ${user.email} / ${user.password}`);
    });

  } catch (error) {
    console.error('Error creating users:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createUsers();