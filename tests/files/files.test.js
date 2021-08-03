import supertest from 'supertest';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import app, { db } from '../../server.js';
import client, { bucket } from '../../config/s3.js';

afterAll(async () => {
  await db.disconnect();
});

describe('Testing local auth routes', () => {
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
      .expect(200, { success: true })
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
    const file = crypto.randomBytes(3 * 10 ** 6);
    hash = crypto.createHash('sha256').update(file).digest('hex');

    await supertest(app).post(`/files?filename=${filename}`)
      .set('Cookie', [`token=${token}`])
      .send(file)
      .expect(200)
      .then((res) => { fileid = res.body.fileid; });
  });

  it('Downloading object', async () => {
    let hashDownload;
    await supertest(app).get(`/files/${fileid}`)
      .expect(200)
      .then((res) => { hashDownload = crypto.createHash('sha256').update(res.body).digest('hex'); });

    expect(hashDownload).toBe(hash);
  });

  it('Deleting object', async () => {
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

    expect(await keyExists(fileid)).toBe(false);
  });

  it('Deleting account', async () => {
    await supertest(app).delete('/account')
      .set('Cookie', [`token=${token}`])
      .expect(200, { success: true, msg: 'User succesfully deleted' });

    user = await db.model('User').findOne({ 'auth.local.username': username }, { 'auth.local': 1 });
    expect(user).toBeFalsy();
  });
});
