import express from 'express';
import jwt from 'jsonwebtoken';
import { DeleteObjectCommand, GetObjectTaggingCommand } from '@aws-sdk/client-s3';

import client, { bucket } from '../../config/s3.js';
import pool from '../../config/database.js';
import authenticateJWT from '../../middlewares/authenticateJWT.js';

const router = express.Router();

router.delete('/:key', authenticateJWT, async (req, res) => {
  try {
    let owner = await client.send(new GetObjectTaggingCommand({
      Bucket: bucket,
      Key: req.params.key,
    }));
    owner = owner.TagSet.find((obj) => obj.Key === 'owner').Value;
    if (owner === jwt.decode(req.cookies.token).sub) {
      try {
        await client.send(new DeleteObjectCommand({
          Bucket: bucket,
          Key: req.params.key,
        }));

        await pool.query('DELETE FROM files WHERE fileid = $1', [req.params.key]);

        return res.status(200).json({ success: true });
      } catch (error) {
        return res.status(401).json({ success: false, msg: 'Error' });
      }
    } else {
      return res.status(401).json({ success: false, msg: 'Unauthorized' });
    }
  } catch (error) {
    return res.status(404).json({ success: false, msg: 'Not found' });
  }
});

export default router;
