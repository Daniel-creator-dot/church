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
  role VARCHAR(50) DEFAULT 'Member',
  password VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist for backward compatibility
ALTER TABLE members ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'Member';
ALTER TABLE members ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE members ADD COLUMN IF NOT EXISTS date_of_birth DATE;

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

-- Attendance records
CREATE TABLE IF NOT EXISTS attendance_records (
  id SERIAL PRIMARY KEY,
  service_date DATE NOT NULL,
  service_type VARCHAR(50) NOT NULL,
  headcount INTEGER DEFAULT 0,
  attended_member_ids TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sermons
CREATE TABLE IF NOT EXISTS sermons (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  speaker VARCHAR(255),
  sermon_date DATE DEFAULT CURRENT_DATE,
  theme VARCHAR(255),
  bible_verse TEXT,
  notes TEXT,
  video_url TEXT,
  audio_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  announcement_date DATE DEFAULT CURRENT_DATE,
  category VARCHAR(50) DEFAULT 'General',
  status VARCHAR(50) DEFAULT 'Published',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prayer requests
CREATE TABLE IF NOT EXISTS prayer_requests (
  id SERIAL PRIMARY KEY,
  submitted_by VARCHAR(255),
  email VARCHAR(255),
  request TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'Pending',
  request_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Devotionals
CREATE TABLE IF NOT EXISTS devotionals (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  devotional_date DATE DEFAULT CURRENT_DATE,
  scripture TEXT,
  author VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Media assets
CREATE TABLE IF NOT EXISTS media_assets (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  media_type VARCHAR(50),
  url TEXT,
  description TEXT,
  upload_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(service_date);
CREATE INDEX IF NOT EXISTS idx_sermons_date ON sermons(sermon_date);
CREATE INDEX IF NOT EXISTS idx_announcements_date ON announcements(announcement_date);
CREATE INDEX IF NOT EXISTS idx_prayer_date ON prayer_requests(request_date);
CREATE INDEX IF NOT EXISTS idx_devotionals_date ON devotionals(devotional_date);

-- ========== ChMeetings-inspired modules ==========

-- Households (family grouping)
CREATE TABLE IF NOT EXISTS households (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  primary_member_id INTEGER REFERENCES members(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE members ADD COLUMN IF NOT EXISTS household_id INTEGER REFERENCES households(id);

-- Designated giving funds
CREATE TABLE IF NOT EXISTS funds (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  goal_amount DECIMAL(12,2),
  raised_amount DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE donations ADD COLUMN IF NOT EXISTS fund_id INTEGER REFERENCES funds(id);

-- Pledge campaigns
CREATE TABLE IF NOT EXISTS pledge_campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  goal_amount DECIMAL(12,2),
  start_date DATE,
  end_date DATE,
  fund_id INTEGER REFERENCES funds(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pledges (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES pledge_campaigns(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id),
  pledgor_name VARCHAR(255),
  pledged_amount DECIMAL(12,2) NOT NULL,
  fulfilled_amount DECIMAL(12,2) DEFAULT 0,
  frequency VARCHAR(50) DEFAULT 'one-time',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Volunteer scheduling
CREATE TABLE IF NOT EXISTS volunteer_roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  ministry_id INTEGER REFERENCES ministries(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS volunteer_assignments (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
  member_id INTEGER REFERENCES members(id),
  role_id INTEGER REFERENCES volunteer_roles(id),
  role_name VARCHAR(255),
  assignment_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'Scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Worship planning & song library
CREATE TABLE IF NOT EXISTS songs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255),
  song_key VARCHAR(20),
  theme VARCHAR(255),
  lyrics TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS worship_plans (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  service_date DATE NOT NULL,
  service_type VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS worship_plan_items (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER REFERENCES worship_plans(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  song_id INTEGER REFERENCES songs(id),
  duration_minutes INTEGER,
  assigned_to VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  notes TEXT
);

-- Communications (email/SMS/push to groups)
CREATE TABLE IF NOT EXISTS communications (
  id SERIAL PRIMARY KEY,
  subject VARCHAR(255) NOT NULL,
  body TEXT,
  channel VARCHAR(50) DEFAULT 'email',
  target_group VARCHAR(100) DEFAULT 'all',
  ministry_id INTEGER REFERENCES ministries(id),
  status VARCHAR(50) DEFAULT 'Sent',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_by VARCHAR(255)
);

-- Custom forms
CREATE TABLE IF NOT EXISTS custom_forms (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  fields JSONB DEFAULT '[]',
  is_public BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS form_submissions (
  id SERIAL PRIMARY KEY,
  form_id INTEGER REFERENCES custom_forms(id) ON DELETE CASCADE,
  submitter_name VARCHAR(255),
  submitter_email VARCHAR(255),
  responses JSONB DEFAULT '{}',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Finance accounting ledger
CREATE TABLE IF NOT EXISTS finance_transactions (
  id SERIAL PRIMARY KEY,
  transaction_date DATE DEFAULT CURRENT_DATE,
  type VARCHAR(20) NOT NULL,
  category VARCHAR(100),
  fund_id INTEGER REFERENCES funds(id),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  approved_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event check-in (QR/kiosk)
CREATE TABLE IF NOT EXISTS event_checkins (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id),
  checkin_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  checkout_time TIMESTAMP,
  checked_in_by VARCHAR(255),
  family_tag VARCHAR(50),
  UNIQUE(event_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_households_name ON households(name);
CREATE INDEX IF NOT EXISTS idx_funds_active ON funds(is_active);
CREATE INDEX IF NOT EXISTS idx_pledges_campaign ON pledges(campaign_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_assignments_date ON volunteer_assignments(assignment_date);
CREATE INDEX IF NOT EXISTS idx_worship_plans_date ON worship_plans(service_date);
CREATE INDEX IF NOT EXISTS idx_communications_sent ON communications(sent_at);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON finance_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_event_checkins_event ON event_checkins(event_id);

-- ========== Innovation modules ==========

-- Prayer wall enhancements
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'General';
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS prayed_count INTEGER DEFAULT 0;

-- Small groups / cell fellowship
CREATE TABLE IF NOT EXISTS small_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  leader_id INTEGER REFERENCES members(id),
  leader_name VARCHAR(255),
  meeting_day VARCHAR(20),
  meeting_time VARCHAR(20),
  location VARCHAR(255),
  max_members INTEGER DEFAULT 12,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES small_groups(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id),
  role VARCHAR(50) DEFAULT 'Member',
  joined_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(group_id, member_id)
);

CREATE TABLE IF NOT EXISTS group_meetings (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES small_groups(id) ON DELETE CASCADE,
  meeting_date DATE NOT NULL,
  topic VARCHAR(255),
  attendance_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_small_groups_active ON small_groups(is_active);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_meetings_date ON group_meetings(meeting_date);

-- Bookstore
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  price DECIMAL(10,2) DEFAULT 0,
  description TEXT,
  cover_url TEXT,
  pages JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS book_purchases (
  id SERIAL PRIMARY KEY,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id),
  purchaser_name VARCHAR(255),
  payment_method VARCHAR(50) DEFAULT 'Cash',
  amount DECIMAL(10,2),
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(book_id, member_id)
);

-- Live streams
CREATE TABLE IF NOT EXISTS live_streams (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  speaker VARCHAR(255),
  stream_date DATE,
  stream_time VARCHAR(20),
  status VARCHAR(20) DEFAULT 'Upcoming',
  embed_url TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Discipleship pathways
CREATE TABLE IF NOT EXISTS discipleship_steps (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'New Convert',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS member_pathway_progress (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  step_id INTEGER REFERENCES discipleship_steps(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'Pending',
  completed_date DATE,
  notes TEXT,
  UNIQUE(member_id, step_id)
);

CREATE INDEX IF NOT EXISTS idx_books_active ON books(is_active);
CREATE INDEX IF NOT EXISTS idx_book_purchases_member ON book_purchases(member_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_date ON live_streams(stream_date);
CREATE INDEX IF NOT EXISTS idx_pathway_progress_member ON member_pathway_progress(member_id);
