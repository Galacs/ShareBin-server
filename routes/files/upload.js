import express from 'express';
import crypto from 'crypto';

import jwt from 'jsonwebtoken';

import { Upload } from '@aws-sdk/lib-storage';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { encode } from '../../lib/base64url.js';
import pool from '../../config/database.js';
import authenticateJWT from '../../middlewares/authenticateJWT.js';
import client, { bucket } from '../../config/s3.js';
import logger from '../../lib/logger.js';

const router = express.Router();

router.post('/', authenticateJWT, async (req, res) => {
  const startTime = new Date();
  if (req.query.filename === '') return res.json({ success: false, msg: 'empty file' });
  let uuid = encode(crypto.randomBytes(16));
  // let uuid = 'salut';
  req.query.filename = decodeURI(req.query.filename);
  async function keyExists(key) {
    try {
      await client.send(new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      }));
      return true;
    } catch (error) {
      return false;
    }
  }

  let exists = await keyExists(uuid);
  while (exists) {
    uuid = encode(crypto.randomBytes(16));
    // eslint-disable-next-line no-await-in-loop
    exists = await keyExists(uuid);
  }
  const userId = jwt.decode(req.cookies.token).sub;
  logger.info(`File upload started: ${req.query.filename} ${uuid} ${req.get('content-length')} ${userId}`);
  const target = {
    Bucket: bucket,
    Key: uuid,
    Body: req,
  };
  try {
    const paralellUploads3 = new Upload({
      client,
      tags: [
        {
          Key: 'filename',
          Value: req.query.filename,
        },
        {
          Key: 'owner',
          Value: userId,
        },
      ],
      queueSize: 5,
      params: target,
    });

    // paralellUploads3.on('httpUploadProgress', (progress) => {
    //   console.log(Math.round((progress.loaded / req.header('Content-Length')) * 100));
    // });

    await paralellUploads3.done();

    const expirationDate = new Date(req.query.expiration * 1000);

    await pool.query(
      'INSERT INTO files(fileid, ownerid, filename, upload, expiration) VALUES ($1, $2, $3, current_timestamp, $4)',
      [uuid, userId, req.query.filename, expirationDate],
    );
    logger.info(`File upload complete: ${req.query.filename} ${uuid} ${req.get('content-length')} ${userId} ${new Date() - startTime}ms`);
    res.json({
      success: true,
      fileid: uuid,
      url: `${process.env.URL || 'http://localhost:1500'}/files/${uuid}`,
    });
  } catch (e) {
    if (e.code === 'ECONNRESET') {
      logger.warn(`File upload interrupted ${e}`);
    } else {
      logger.error(`File upload interrupted ${e}`);
    }
    res.json({ success: false });
  }
});

export default router;
