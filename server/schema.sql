-- Church Management Database Schema

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  date_of_birth DATE,
  membership_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location VARCHAR(255),
  capacity INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event registrations
CREATE TABLE IF NOT EXISTS event_registrations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, member_id)
);

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  donation_date DATE DEFAULT CURRENT_DATE,
  donation_type VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ministries table
CREATE TABLE IF NOT EXISTS ministries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  leader_id INTEGER REFERENCES members(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ministry memberships
CREATE TABLE IF NOT EXISTS ministry_members (
  id SERIAL PRIMARY KEY,
  ministry_id INTEGER REFERENCES ministries(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  role VARCHAR(100),
  join_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(ministry_id, member_id)
);

-- Visitors table
CREATE TABLE IF NOT EXISTS visitors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  visit_date DATE DEFAULT CURRENT_DATE,
  invited_by VARCHAR(255),
  prayer_request TEXT,
  assigned_follow_up_officer VARCHAR(255),
  status VARCHAR(50) DEFAULT 'New',
  follow_up_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Follow-ups table
CREATE TABLE IF NOT EXISTS follow_ups (
  id SERIAL PRIMARY KEY,
  target_person_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  target_person_name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'Visitor', 'Sick Visitation', 'Inactive Member', 'Counseling', 'New Convert'
  assigned_to_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
  assigned_to_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'In Progress', 'Completed'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_donations_date ON donations(donation_date);
CREATE INDEX IF NOT EXISTS idx_donations_member ON donations(member_id);
CREATE INDEX IF NOT EXISTS idx_followups_target ON follow_ups(target_person_id);
CREATE INDEX IF NOT EXISTS idx_followups_assigned ON follow_ups(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_followups_status ON follow_ups(status);
