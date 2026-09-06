import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'church',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'Admin',
    };

const pool = new Pool({
  ...poolConfig,
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 8000,
  allowExitOnIdle: true,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;
