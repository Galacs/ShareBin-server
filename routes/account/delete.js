import express from 'express';
import jwt from 'jsonwebtoken';

import { validPassword } from '../../lib/utils.js';
import pool from '../../config/database.js';
import authenticateJWT from '../../config/authenticateJWT.js';

const router = express.Router();

// Delete a user
router.delete('/', authenticateJWT, async (req, res) => {
  try {
    const data = await pool.query('SELECT * FROM auth.local WHERE userid = $1', [jwt.decode(req.cookies.token).sub]);
    if (data.rows.length === 0) {
      return res.status(401).json({ success: false, msg: 'could not find user' });
    }
    if (validPassword(req.body.password, data.rows[0].password, data.rows[0].salt)) {
      await pool.query('DELETE FROM users WHERE userid = $1', [jwt.decode(req.cookies.token).sub]);
      res.status(200).json({ success: true, msg: 'User succesfully deleted' });
    } else {
      res.status(409).json({ success: false, msg: 'Unauthorized' });
    }
  } catch (e) {
    if (e.code === '23503') {
      return res.json({ success: false, msg: 'User still has files' });
    }
    console.log(e);
    res.json({ success: false });
  }
});

export default router;
