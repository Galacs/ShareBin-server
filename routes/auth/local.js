import express from 'express';

import { issueJWT, genPassword, validPassword } from '../../lib/utils.js';
import ObjectId from '../../lib/objectId.js';

import pool from '../../config/database.js';
import logger from '../../lib/logger.js';

const router = express.Router();

// Validate an existing user and issue a JWT
router.post('/login', async (req, res) => {
  try {
    const data = await pool.query('SELECT * FROM auth.local WHERE username = $1', [req.body.username]);
    if (data.rows.length === 0) {
      return res.status(401).json({ success: false, msg: 'could not find user' });
    }
    if (validPassword(req.body.password, data.rows[0].password, data.rows[0].salt)) {
      const tokenObject = issueJWT(data.rows[0].userid);
      const refreshTokenObject = issueJWT(data.rows[0].userid, '31d', 2);

      // Create new Date instance
      const date = new Date();
      // Add time
      const minutes = 15;
      date.setMinutes(date.getMinutes() + minutes);

      // Create new Date instance
      const refreshDate = new Date();
      // Add time
      refreshDate.setMonth(date.getMonth() + 1);

      res.cookie('refreshToken', refreshTokenObject.token, {
        expires: refreshDate,
        secure: false,
        httpOnly: true,
        path: '/auth/refresh',
        sameSite: 'strict',
      });
      res.cookie('token', tokenObject.token, {
        expires: date,
        secure: false,
        httpOnly: true,
        sameSite: 'strict',
      });
      res.status(200).json({ success: true, username: req.body.username });
    } else {
      res.status(401).json({ success: false, msg: 'you have entered the wrong password' });
    }
  } catch (e) {
    logger.error(e);
    res.json({ success: false });
  }
});

// Register a new user
router.post('/register', async (req, res) => {
  const userid = ObjectId();
  const saltHash = genPassword(req.body.password);
  const { salt } = saltHash;
  const { hash } = saltHash;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO users(userid) VALUES ($1)', [userid]);
    await client.query('INSERT INTO auth.local(userid, username, salt, password) VALUES ($1, $2, $3, $4)',
      [userid, req.body.username, salt, hash]);
    await client.query('COMMIT');
    return res.json({ success: true });
  } catch (e) {
    if (e.code === '23505') {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, msg: 'User already exists' });
    }
    logger.error(e);
    return res.json({ success: false });
  } finally {
    client.release();
  }
});

export default router;
