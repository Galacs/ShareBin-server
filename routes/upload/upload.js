import express from 'express';
import passport from 'passport';
import crypto from 'crypto';

import jwt from 'jsonwebtoken';

import { Upload } from '@aws-sdk/lib-storage';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { encode } from '../../lib/base64url.js';

const bucket = 'bucket';

// const client = new S3Client({
//   forcePathStyle: true,
//   endpoint: 'http://192.168.0.21.nip.io:30447',
//   tls: false,
//   region: 'my-store',
//   credentials: {
//     accessKeyId: 'K6RWV4P39Y1P4QTPW78P',
//     secretAccessKey: 'qRqDrH5OHTeGE8Q2AWImJS8ieGKk68CstrPF6a0L',
//   },
// });
const client = new S3Client({
  forcePathStyle: true,
  endpoint: 'http://127.0.0.1:9000',
  tls: false,
  region: 'my-store',
  credentials: {
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
  },
});
const router = express.Router();

router.post('/upload', passport.authenticate('jwt', { session: false }), async (req, res) => {
  let uuid = encode(crypto.randomBytes(16));
  // let uuid = 'salut';
  console.log(uuid);

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

    paralellUploads3.on('httpUploadProgress', (progress) => {
      console.log(Math.round((progress.loaded / req.header('Content-Length')) * 100));
    });

    await paralellUploads3.done();
    res.json({ success: true, fileid: uuid });
  } catch (e) {
    res.json({ success: false, msg: e });
  }
});

export default router;
