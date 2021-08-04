import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import { DeleteObjectCommand, GetObjectTaggingCommand } from '@aws-sdk/client-s3';

import client, { bucket } from '../../config/s3.js';

const router = express.Router();
const User = mongoose.model('User');

router.delete('/:key', async (req, res) => {
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

        await User.updateOne({ _id: owner }, { $pull: { objects: req.params.key } });

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
