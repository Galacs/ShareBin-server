import express from 'express';
import passport from 'passport';
import crypto from 'crypto';
import mongoose from 'mongoose';

import jwt from 'jsonwebtoken';

import { Upload } from '@aws-sdk/lib-storage';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { encode } from '../../lib/base64url.js';

import client, { bucket } from '../../config/s3.js';

const router = express.Router();
const User = mongoose.model('User');

router.post('/', passport.authenticate('jwt', { session: false, failureRedirect: '/auth/refresh' }), async (req, res) => {
  if (req.query.filename === '') return res.json({ success: false, msg: 'empty file' });
  let uuid = encode(crypto.randomBytes(16));
  // let uuid = 'salut';
  // console.log(uuid);

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

    // paralellUploads3.on('httpUploadProgress', (progress) => {
    //   console.log(Math.round((progress.loaded / req.header('Content-Length')) * 100));
    // });

    await paralellUploads3.done();

    const expirationDate = new Date(req.query.expiration * 1000);

    // eslint-disable-next-line max-len
    await User.findOneAndUpdate({ _id: userId }, {
      $push: {
        objects: {
          id: uuid,
          filename: req.query.filename,
          // eslint-disable-next-line new-cap
          uploadDate: new Date(),
          expirationDate,
        },
      },
    });

    res.json({
      success: true,
      fileid: uuid,
      url: `${process.env.URL || 'localhost:1500'}/files/${uuid}`,
    });
  } catch (e) {
    res.json({ success: false, msg: e });
  }
});

export default router;
