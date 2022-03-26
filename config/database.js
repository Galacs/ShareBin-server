import fs from 'fs';
import pkg from 'pg';

const { Pool } = pkg;

const dbCreatePool = new Pool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

dbCreatePool.query('CREATE DATABASE sharebin')
  .catch((e) => {
    if (e.code !== '42P04') {
      console.log(e);
    }
  });

dbCreatePool.end();

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
