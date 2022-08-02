import express from 'express';
import jwt from 'jsonwebtoken';

import pool from '../../config/database.js';
import authenticateJWT from '../../middlewares/authenticateJWT.js';

const router = express.Router();

router.get('/:key', authenticateJWT, async (req, res) => {
  try {
    const data = await pool.query('SELECT * FROM files WHERE ownerid = $1 AND fileid = $2 ORDER BY upload DESC', [jwt.decode(req.cookies.token).sub, req.params.key]);
    res.status(200).json(data.rows);
  } catch (e) {
    res.json({ success: false, msg: e });
  }
});

export default router;
