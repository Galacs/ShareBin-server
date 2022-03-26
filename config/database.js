import fs from 'fs';
import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'sharebin',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const sql = fs.readFileSync('sql/create_tables.sql').toString();

pool.query(sql);

export default pool;
