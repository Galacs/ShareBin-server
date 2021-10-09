import mongoose from 'mongoose';
import express from 'express';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

import { issueJWT } from '../../lib/utils.js';

const router = express.Router();
const User = mongoose.model('User');

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
    const user = await User.findOne({ _id: userId }, { 'auth.local': 1 });
    const tokenObject = issueJWT(user);
    const refreshTokenObject = issueJWT(user, '31d', 2);

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
