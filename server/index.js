import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import membersRouter from './routes/members.js';
import eventsRouter from './routes/events.js';
import donationsRouter from './routes/donations.js';
import ministriesRouter from './routes/ministries.js';
import followupsRouter from './routes/followups.js';
import settingsRouter from './routes/settings.js';
import visitorsRouter from './routes/visitors.js';
import authRouter from './routes/auth.js';

dotenv.config();

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
