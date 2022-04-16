import express from 'express';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

import { issueJWT } from '../../lib/utils.js';
import pool from '../../config/database.js';

const router = express.Router();

const pathToKeyRefresh = path.join(path.resolve(), 'keys', 'id_rsa_pub_refresh.pem');
const PUB_KEY_REFRESH = fs.readFileSync(pathToKeyRefresh, 'utf8');

// Validate an existing user and issue a JWT
router.get('/', async (req, res, next) => {
  try {
    if (!req.cookies.refreshToken) return res.status(401).send('No refresh token');
    if (!jwt.verify(req.cookies.refreshToken, PUB_KEY_REFRESH)) return res.status(401).json({ msg: 'Expired refresh token' });
  } catch (e) {
    return res.status(401).json({ msg: 'No refresh token' });
  }
  try {
    const userId = jwt.decode(req.cookies.refreshToken).sub;
    const data = await pool.query('SELECT * FROM auth.local WHERE userid = $1', [userId]);
    if (data.rows.length === 0) {
      return res.status(401).json({ success: false, msg: 'could not find user' });
    }
    // Update ip and last login
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await pool.query('UPDATE users SET lastip = $1, lastlogin = now()', [clientIp]);

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

    res.cookie('token', tokenObject.token, {
      expires: date,
      secure: false,
      httpOnly: true,
    });
    res.clearCookie('refreshToken');
    res.cookie('refreshToken', refreshTokenObject.token, {
      expires: refreshDate,
      secure: false,
      httpOnly: true,
      path: '/auth/refresh',
    });
    // res.status(200).json({ success: true });
    res.redirect('back');
  } catch (e) {
    next(e);
  }
});

export default router;
