import supertest from 'supertest';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { HeadObjectCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import app, { db } from '../../server.js';
import client, { bucket } from '../../config/s3.js';

afterAll(async () => {
  await db.disconnect();
});

async function createBucket() {
  try {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
  // eslint-disable-next-line no-empty
  } catch (error) { }
}
createBucket();

describe('Testing files', () => {
  const username = crypto.randomBytes(8).toString('base64');
  const password = crypto.randomBytes(8).toString('base64');
  const filename = crypto.randomBytes(8).toString('base64');
  let user;
  let token;
  let hash;
  let fileid;

  it('Creating account for later use', async () => {
    await supertest(app).post('/auth/local/register')
      .send({ username, password })
      .expect(200, { success: true });

    user = await db.model('User').findOne({ 'auth.local.username': username }, { 'auth.local': 1 });
    expect(user).toBeTruthy();
  });

  it('Logging into account and storing token', async () => {
    await supertest(app).post('/auth/local/login')
      .send({ username, password })
      .expect(200, { success: true, username })
      .expect(async (res) => {
        // eslint-disable-next-line prefer-destructuring
        token = res.headers['set-cookie'].find((obj) => obj.startsWith('token'))
          .split('=')[1].split(';')[0];
        // eslint-disable-next-line no-underscore-dangle
        expect(JSON.stringify(user._id)).toBe(JSON.stringify(jwt.decode(token).sub));

        const pathToKey = path.join(path.resolve(), 'keys', 'id_rsa_pub.pem');
        const PUB_KEY = fs.readFileSync(pathToKey, 'utf8');
        expect(jwt.verify(token, PUB_KEY)).toBeTruthy();
      });
  });

  it('Uploading object', async () => {
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

    const file = crypto.randomBytes(3 * 10 ** 6);
    hash = crypto.createHash('sha256').update(file.toString()).digest('hex');
    const userId = jwt.decode(token).sub;
    await supertest(app).post(`/files?filename=${encodeURI(filename)}&expiration=${Math.floor(new Date().getTime() / 1000 + 10000000)}`)
      .set('Cookie', [`token=${token}`])
      .send(file)
      .expect(200)
      .then((res) => { fileid = res.body.fileid; });

    expect(await keyExists(fileid)).toBeTruthy();
    let id;
    do {
      // eslint-disable-next-line no-await-in-loop
      id = await db.model('User').findOne({ _id: userId }, { objects: { $elemMatch: { id: fileid, filename } } });
    } while (!id.objects.id);
    expect(id.objects.id[0]).toBe(fileid);
    expect(id.objects.filename[0]).toBe(filename);
    expect(await db.model('User').exists({ _id: userId, objects: { $elemMatch: { id: fileid, filename } } })).toBeTruthy();
  });

  it('Downloading object', async () => {
    let hashDownload;
    await supertest(app).get(`/files/${fileid}`)
      .expect(200)
      .then((res) => { hashDownload = crypto.createHash('sha256').update(res.body.toString()).digest('hex'); });

    expect(hashDownload).toBe(hash);
  });

  it('Deleting object', async () => {
    const userId = jwt.decode(token).sub;
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
    await supertest(app).delete(`/files/${fileid}`)
      .set('Cookie', [`token=${token}`])
      .expect(200, { success: true });

    const id = await db.model('User').findOne({ _id: userId }, { objects: { $elemMatch: { id: fileid, filename } } });
    expect(id.objects).toMatchObject({});
    expect(await keyExists(fileid)).toBe(false);
  });

  it('Deleting account', async () => {
    await supertest(app).delete('/account')
      .set('Cookie', [`token=${token}`])
      .send({ password })
      .expect(200, { success: true, msg: 'User succesfully deleted' });

    user = await db.model('User').findOne({ 'auth.local.username': username }, { 'auth.local': 1 });
    expect(user).toBeFalsy();
  });
});
