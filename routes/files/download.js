import express from 'express';
import mime from 'mime-types';

import { S3Client, GetObjectCommand, GetObjectTaggingCommand } from '@aws-sdk/client-s3';

const bucket = 'bucket';

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

router.get('/:key', async (req, res) => {
  try {
    const data = await client.send(new GetObjectCommand({
      Bucket: bucket,
      Key: req.params.key,
      Range: req.header('Range'),
    }));
    let filename = await client.send(new GetObjectTaggingCommand({
      Bucket: bucket,
      Key: req.params.key,
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
    data.Body.pipe(res);
  } catch (error) {
    return res.status(404).json({ success: false, msg: 'Not found' });
  }
});

export default router;
