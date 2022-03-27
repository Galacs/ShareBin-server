import express from 'express';
import jwt from 'jsonwebtoken';

import authenticateJWT from '../../config/authenticateJWT.js';
import pool from '../../config/database.js';

const router = express.Router();

router.get('/', authenticateJWT, async (req, res) => {
  try {
    const data = await pool.query('SELECT * FROM files WHERE ownerid = $1 ORDER BY upload DESC', [jwt.decode(req.cookies.token).sub]);
    res.status(200).json(data.rows);
  } catch (e) {
    res.json({ success: false, msg: e });
  }
});

export default router;
