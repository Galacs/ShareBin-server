import { DeleteObjectsCommand } from '@aws-sdk/client-s3';

import client, { bucket } from './config/s3.js';
import pool from './config/database.js';

const fileIds = [];

pool.query('SELECT fileid FROM files where expiration < $1', [new Date()])
  .then((data) => {
    data.rows.forEach((obj) => fileIds.push(obj.fileid));
    if (fileIds.length === 0) process.exit();
    console.log(`${fileIds.length} fichiers vont etre supprimé`);
    const objects = fileIds.map((obj) => ({ Key: obj }));
    client.send(new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: objects,
        Quiet: true,
      },
    })).then(() => {
      console.log(`${objects.length} fichiers ont été supprimé de s3`);
    });
    pool.query('DELETE FROM files where expiration < $1', [new Date()])
      .then(() => {
        console.log(`${objects.length} fichiers ont été supprimé de postgres`);
        process.exit();
      });
  });
