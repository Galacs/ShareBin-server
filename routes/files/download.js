import express from 'express';
import mime from 'mime-types';

import { GetObjectCommand, GetObjectTaggingCommand } from '@aws-sdk/client-s3';

import client, { bucket } from '../../config/s3.js';
import pool from '../../config/database.js';
import logger from '../../lib/logger.js';

const router = express.Router();

router.get('/:key', async (req, res) => {
  try {
    let filename = await client.send(new GetObjectTaggingCommand({
      Bucket: bucket,
      Key: req.params.key,
    }));
    const data = await client.send(new GetObjectCommand({
      Bucket: bucket,
      Key: req.params.key,
      Range: req.header('Range'),
    }));
    filename = filename.TagSet.find((obj) => obj.Key === 'filename').Value;
    if (req.header('Range')) {
      res.writeHead(206, {
        'Accept-Ranges': 'bytes',
        'Content-Disposition': `filename="${filename}"`,
        'Content-Type': mime.contentType(filename) || 'application/octet-stream',
        'Content-Range': data.ContentRange,
        'Content-Length': data.ContentLength,
      });
    } else {
      res.writeHead(200, {
        'Accept-Ranges': 'bytes',
        'Content-Disposition': `filename="${filename}"`,
        'Content-Type': mime.contentType(filename) || 'application/octet-stream',
        'Content-Length': data.ContentLength,
      });
    }
    res.on('close', () => data.Body.destroy());
    res.on('finish', () => pool.query('UPDATE files SET downloaded = downloaded + 1 WHERE fileid = $1', [req.params.key]));
    await data.Body.pipe(res);
  } catch (error) {
    return res.status(404).json({ success: false, msg: 'Not found' });
  }
});

export default router;
