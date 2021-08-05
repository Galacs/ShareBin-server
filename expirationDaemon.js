import { } from './models/user.js';
import mongoose from 'mongoose';
import { DeleteObjectsCommand } from '@aws-sdk/client-s3';
import client, { bucket } from './config/s3.js';
import db from './config/database.js';

const User = mongoose.model('User');

const fileIds = [];

// Trouve les fichiers expiré est les met dans fileIds
db.connection.on('connected', () => {
  User.aggregate([
    // { $project: { 'objects.id': 1, 'objects.expirationDate': 1 } },
    { $match: { 'objects.expirationDate': { $gt: new Date() } } },
    {
      $redact: {
        $cond: {
          if: { $gt: ['$expirationDate', new Date()] },
          then: '$$PRUNE',
          else: '$$DESCEND',
        },
      },
    },
  ]).then((user) => {
    user.forEach((element) => {
      element.objects.forEach((obj) => fileIds.push(obj));
    });
    if (fileIds.length === 0) process.exit();
    console.log(`${fileIds.length} fichiers vont etre supprimé`);
    const objects = fileIds.map((object) => ({ Key: object.id }));
    console.log(objects);
    client.send(new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: objects,
        Quiet: true,
      },
    })).then(() => {
      console.log(`${objects.length} fichiers ont était supprimé de s3`);
    });
    User.updateMany(
      { 'objects.expirationDate': { $gt: new Date() } },
      { $pull: { objects: { $in: fileIds } } },
      { multi: true },
    ).then(() => {
      console.log(`${objects.length} fichiers ont était supprimé de mongoDB`);
      db.disconnect();
    });
  });
});
