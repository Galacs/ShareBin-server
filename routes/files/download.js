import express from 'express';

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
    const mime = await pool.query('SELECT mime FROM files WHERE fileid = $1', [req.params.key]);
    if (req.header('Range')) {
      res.writeHead(206, {
        'Accept-Ranges': 'bytes',
        'Content-Disposition': `filename="${filename}"`,
        'Content-Type': mime.rows[0].mime,
        'Content-Range': data.ContentRange,
        'Content-Length': data.ContentLength,
      });
    } else {
      res.writeHead(200, {
        'Accept-Ranges': 'bytes',
        'Content-Disposition': `filename="${filename}"`,
        'Content-Type': mime.rows[0].mime,
        'Content-Length': data.ContentLength,
      });
    }
    const startTime = new Date();
    res.on('pipe', () => logger.info(`File download started: ${filename} ${req.params.key} ${data.ContentLength}`));
    res.on('close', () => {
      data.Body.destroy();
      logger.info(`File upload interupted: ${filename} ${req.params.key} ${data.ContentLength} ${new Date() - startTime}ms`);
    });
    res.on('finish', () => {
      pool.query('UPDATE files SET downloaded = downloaded + 1 WHERE fileid = $1', [req.params.key]);
      logger.info(`File upload complete: ${filename} ${req.params.key} ${data.ContentLength} ${new Date() - startTime}ms`);
    });
    await data.Body.pipe(res);
  } catch (error) {
    logger.info(`File ${req.params.key} not found`);
    return res.status(404).json({ success: false, msg: 'Not found' });
  }
});

export default router;
