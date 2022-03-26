import fs from 'fs';
import pkg from 'pg';

const { Pool } = pkg;

// eslint-disable-next-line import/no-mutable-exports
let pool;

if (process.env.NODE_ENV !== 'prod') {
  pool = new Pool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sharebin',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
} else {
  pool = new Pool({
    database: 'sharebin',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

const sql = fs.readFileSync('sql/create_tables.sql').toString();

pool.query(sql);

export default pool;
