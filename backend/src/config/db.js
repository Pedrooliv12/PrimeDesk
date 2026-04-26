const { Pool } = require('pg');
require('dotenv').config();

const {
  DB_HOST,
  DB_PORT = '5432',
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_SSL = 'false'
} = process.env;

if (!DB_HOST || !DB_USER || !DB_NAME) {
  throw new Error('Variáveis de ambiente do banco não configuradas. Defina DB_HOST, DB_USER e DB_NAME.');
}

const pool = new Pool({
  host: DB_HOST,
  port: Number(DB_PORT) || 5432,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  ssl: DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

module.exports = pool;