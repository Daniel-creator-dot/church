import pool from './db.js';

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await pool.query('DELETE FROM event_registrations');
    await pool.query('DELETE FROM ministry_members');
    await pool.query('DELETE FROM follow_ups');
    await pool.query('DELETE FROM donations');
    await pool.query('DELETE FROM events');
    await pool.query('DELETE FROM ministries');
    await pool.query('DELETE FROM members');
    console.log('Cleared existing data');

    let insertedMembers = [];
    let insertedMinistries = [];

    // Insert sample members
    const members = [
      {
        first_name: 'David',
        last_name: 'Nkansah',
        email: 'dnkansah29@gmail.com',
        phone: '+233 24 123 4567',
        address: 'Accra, Ghana',
        date_of_birth: '1992-04-15',
        status: 'active'
      },
      {
        first_name: 'Sarah',
        last_name: 'Jenkins',
        email: 'sarah.j@morningchurch.org',
        phone: '+1 (555) 234-5678',
        address: 'Northside District',
        date_of_birth: '1988-11-23',
        status: 'active'
      },
      {
        first_name: 'James',
        last_name: 'Taylor',
        email: 'james.t@gmail.com',
        phone: '+1 (555) 876-5432',
        address: 'Downtown Boulevard',
        date_of_birth: '1975-08-05',
        status: 'active'
      },
      {
        first_name: 'Mary',
        last_name: 'Mensah',
        email: 'mary.mensah@hotmail.com',
        phone: '+233 27 555 1212',
        address: 'Tema, Ghana',
        date_of_birth: '1968-01-30',
        status: 'active'
      },
      {
        first_name: 'Mark',
        last_name: 'Robertson',
        email: 'mark.rob@gmail.com',
        phone: '+1 (555) 432-1098',
        address: 'Eastside Suburbs',
        date_of_birth: '1995-12-02',
        status: 'active'
      },
      {
        first_name: 'Patricia',
        last_name: 'Alabi',
        email: 'pat.alabi@yahoo.com',
        phone: '+234 803 123 4567',
        address: 'Lagos, Nigeria',
        date_of_birth: '1990-06-12',
        status: 'active'
      },
      {
        first_name: 'Samuel',
        last_name: 'Owusu',
        email: 'sowusu@outlook.com',
        phone: '+233 20 987 6543',
        address: 'Kumasi, Ghana',
        date_of_birth: '1982-10-08',
        status: 'active'
      },
      {
        first_name: 'Grace',
        last_name: 'Thompson',
        email: 'grace.thompson@gmail.com',
        phone: '+1 (555) 765-4321',
        address: 'West Hills',
        date_of_birth: '2001-03-14',
        status: 'inactive'
      }
    ];

    insertedMembers = [];
    for (const member of members) {
      const result = await pool.query(
        'INSERT INTO members (first_name, last_name, email, phone, address, date_of_birth, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [member.first_name, member.last_name, member.email, member.phone, member.address, member.date_of_birth, member.status]
      );
      insertedMembers.push({
        ...member,
        db_id: result.rows[0].id
      });
    }
    console.log(`Inserted ${insertedMembers.length} members`);

    // Insert sample events
    const events = [
      {
        title: 'Sunday Worship Service',
        description: 'Weekly Sunday worship and thanksgiving service',
        event_date: '2026-06-28',
        event_time: '09:00',
        location: 'Main Sanctuary',
        capacity: 200
      },
      {
        title: 'Mid-week Bible Study',
        description: 'Bible study on the book of Ephesians',
        event_date: '2026-07-02',
        event_time: '18:30',
        location: 'Church Hall',
        capacity: 100
      },
      {
        title: 'Prayer Meeting',
        description: 'Mid-year breakthrough prayer night',
        event_date: '2026-07-05',
        event_time: '19:00',
        location: 'Main Sanctuary',
        capacity: 150
      },
      {
        title: 'Youth Conference',
        description: 'Annual youth empowerment conference',
        event_date: '2026-07-10',
        event_time: '10:00',
        location: 'Community Center',
        capacity: 300
      }
    ];

    for (const event of events) {
      await pool.query(
        'INSERT INTO events (title, description, event_date, event_time, location, capacity) VALUES ($1, $2, $3, $4, $5, $6)',
        [event.title, event.description, event.event_date, event.event_time, event.location, event.capacity]
      );
    }
    console.log(`Inserted ${events.length} events`);

    // Insert sample donations using actual member IDs
    const donations = [
      {
        member_id: insertedMembers[0].db_id, // David
        amount: 500.00,
        donation_type: 'tithe',
        notes: 'Monthly tithe'
      },
      {
        member_id: insertedMembers[1].db_id, // Sarah
        amount: 350.00,
        donation_type: 'tithe',
        notes: 'Monthly tithe'
      },
      {
        member_id: null,
        amount: 1250.00,
        donation_type: 'offering',
        notes: 'Special offering'
      },
      {
        member_id: insertedMembers[2].db_id, // James
        amount: 1000.00,
        donation_type: 'project',
        notes: 'Building fund contribution'
      },
      {
        member_id: insertedMembers[3].db_id, // Mary
        amount: 200.00,
        donation_type: 'welfare',
        notes: 'Welfare support'
      },
      {
        member_id: insertedMembers[5].db_id, // Patricia
        amount: 300.00,
        donation_type: 'seed',
        notes: 'Seed offering'
      }
    ];

    for (const donation of donations) {
      await pool.query(
        'INSERT INTO donations (member_id, amount, donation_type, notes) VALUES ($1, $2, $3, $4)',
        [donation.member_id, donation.amount, donation.donation_type, donation.notes]
      );
    }
    console.log(`Inserted ${donations.length} donations`);

    // Insert sample ministries using actual member IDs
    const ministries = [
      {
        name: 'Choir Ministry',
        description: 'Music and worship team',
        leader_id: insertedMembers[1].db_id // Sarah
      },
      {
        name: 'Ushers Ministry',
        description: 'Hospitality and seating arrangement',
        leader_id: insertedMembers[4].db_id // Mark
      },
      {
        name: 'Prayer Team',
        description: 'Intercessory prayer team',
        leader_id: insertedMembers[2].db_id // James
      },
      {
        name: 'Media Ministry',
        description: 'Technical and media support',
        leader_id: insertedMembers[0].db_id // David
      }
    ];

    insertedMinistries = [];
    for (const ministry of ministries) {
      const result = await pool.query(
        'INSERT INTO ministries (name, description, leader_id) VALUES ($1, $2, $3) RETURNING id',
        [ministry.name, ministry.description, ministry.leader_id]
      );
      insertedMinistries.push({
        ...ministry,
        db_id: result.rows[0].id
      });
    }
    console.log(`Inserted ${insertedMinistries.length} ministries`);

    // Insert ministry members to create leaders using actual member IDs and ministry IDs
    const ministryMembers = [
      { ministry_id: insertedMinistries[0].db_id, member_id: insertedMembers[1].db_id, role: 'Leader' }, // Sarah - Choir
      { ministry_id: insertedMinistries[1].db_id, member_id: insertedMembers[4].db_id, role: 'Head' }, // Mark - Ushers
      { ministry_id: insertedMinistries[2].db_id, member_id: insertedMembers[2].db_id, role: 'Leader' }, // James - Prayer
      { ministry_id: insertedMinistries[3].db_id, member_id: insertedMembers[0].db_id, role: 'Head' }, // David - Media
      { ministry_id: insertedMinistries[0].db_id, member_id: insertedMembers[5].db_id, role: 'Member' }, // Patricia - Choir
      { ministry_id: insertedMinistries[1].db_id, member_id: insertedMembers[6].db_id, role: 'Member' } // Samuel - Ushers
    ];

    for (const mm of ministryMembers) {
      await pool.query(
        'INSERT INTO ministry_members (ministry_id, member_id, role) VALUES ($1, $2, $3)',
        [mm.ministry_id, mm.member_id, mm.role]
      );
    }
    console.log(`Inserted ${ministryMembers.length} ministry members`);

    // Insert sample follow-ups using actual member IDs
    const followUps = [
      {
        target_person_id: insertedMembers[7].db_id, // Grace
        target_person_name: 'Grace Thompson',
        category: 'Inactive Member',
        assigned_to_id: insertedMembers[2].db_id, // James
        assigned_to_name: 'James Taylor',
        status: 'Pending',
        notes: 'Member has been inactive for 3 months. Need to check on them.'
      },
      {
        target_person_id: insertedMembers[4].db_id, // Mark
        target_person_name: 'Mark Robertson',
        category: 'Sick Visitation',
        assigned_to_id: insertedMembers[3].db_id, // Mary
        assigned_to_name: 'Mary Mensah',
        status: 'In Progress',
        notes: 'Member reported illness. Hospital visit scheduled.'
      },
      {
        target_person_id: insertedMembers[5].db_id, // Patricia
        target_person_name: 'Patricia Alabi',
        category: 'Counseling',
        assigned_to_id: insertedMembers[1].db_id, // Sarah
        assigned_to_name: 'Sarah Jenkins',
        status: 'Pending',
        notes: 'Requested counseling session regarding family matters.'
      }
    ];

    for (const followUp of followUps) {
      await pool.query(
        'INSERT INTO follow_ups (target_person_id, target_person_name, category, assigned_to_id, assigned_to_name, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [followUp.target_person_id, followUp.target_person_name, followUp.category, followUp.assigned_to_id, followUp.assigned_to_name, followUp.status, followUp.notes]
      );
    }
    console.log(`Inserted ${followUps.length} follow-ups`);

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();
