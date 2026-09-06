import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
import membersRouter from './routes/members.js';
import eventsRouter from './routes/events.js';
import donationsRouter from './routes/donations.js';
import ministriesRouter from './routes/ministries.js';
import followupsRouter from './routes/followups.js';
import settingsRouter from './routes/settings.js';
import visitorsRouter from './routes/visitors.js';
import authRouter from './routes/auth.js';
import attendanceRouter from './routes/attendance.js';
import sermonsRouter from './routes/sermons.js';
import announcementsRouter from './routes/announcements.js';
import prayerRouter from './routes/prayer.js';
import devotionalsRouter from './routes/devotionals.js';
import mediaRouter from './routes/media.js';
import householdsRouter from './routes/households.js';
import fundsRouter from './routes/funds.js';
import pledgesRouter from './routes/pledges.js';
import volunteersRouter from './routes/volunteers.js';
import worshipRouter from './routes/worship.js';
import communicationsRouter from './routes/communications.js';
import formsRouter from './routes/forms.js';
import financeRouter from './routes/finance.js';
import checkinRouter from './routes/checkin.js';
import insightsRouter from './routes/insights.js';
import groupsRouter from './routes/groups.js';
import booksRouter from './routes/books.js';
import livestreamsRouter from './routes/livestreams.js';
import discipleshipRouter from './routes/discipleship.js';
import messagingRouter from './routes/messaging.js';
import bootstrapRouter from './routes/bootstrap.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database schema on startup
async function initializeDatabase() {
  try {
    console.log('Checking database schema...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('Database schema initialized successfully!');
  } catch (error) {
    console.error('Error initializing database schema:', error.message);
    // Don't exit, as the schema might already exist
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Church Management API Server' });
});

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

app.use('/api/members', membersRouter);
app.use('/api/events', eventsRouter);
app.use('/api/donations', donationsRouter);
app.use('/api/ministries', ministriesRouter);
app.use('/api/followups', followupsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/visitors', visitorsRouter);
app.use('/api/auth', authRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/sermons', sermonsRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/prayer', prayerRouter);
app.use('/api/devotionals', devotionalsRouter);
app.use('/api/media', mediaRouter);
app.use('/api/households', householdsRouter);
app.use('/api/funds', fundsRouter);
app.use('/api/pledges', pledgesRouter);
app.use('/api/volunteers', volunteersRouter);
app.use('/api/worship', worshipRouter);
app.use('/api/communications', communicationsRouter);
app.use('/api/forms', formsRouter);
app.use('/api/finance', financeRouter);
app.use('/api/checkin', checkinRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/books', booksRouter);
app.use('/api/livestreams', livestreamsRouter);
app.use('/api/discipleship', discipleshipRouter);
app.use('/api/messaging', messagingRouter);
app.use('/api/bootstrap', bootstrapRouter);

// Serve frontend build in production when enabled
const distPath = path.join(__dirname, '..', 'dist');
if (process.env.SERVE_STATIC === 'true' && fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
