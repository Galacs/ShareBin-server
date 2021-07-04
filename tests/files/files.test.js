import supertest from 'supertest';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import app, { db } from '../../server.js';

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
    hash = crypto.createHash('sha256');
    // hash.setEncoding('hex');
    let file;
    for (let i = 0; i < 100; i += 1) {
      const randomBytes = crypto.randomBytes(1000 * 1000);
      hash.write(randomBytes);
      file += randomBytes;
    }
    hash.end(); hash = hash.read();

    await supertest(app).post(`/files?filename=${filename}`)
      .set('Cookie', [`token=${token}`])
      .send(file)
      .expect(200)
      .then((res) => { fileid = res.body.fileid; });
  });

  it('Downloading object', async () => {
    let hashDownload = crypto.createHash('sha256');

    await supertest(app).get(`/files/${fileid}`)
      .expect(200)
      .pipe(hash);

    hashDownload.end();
    hashDownload = hashDownload.read();
    console.log(hash.toString('hex'));
    console.log(hashDownload.toString('hex'));
  });

  it('Testing account deletion', async () => {
    await supertest(app).delete('/account')
      .set('Cookie', [`token=${token}`])
      .expect(200, { success: true, msg: 'User succesfully deleted' });

    user = await db.model('User').findOne({ 'auth.local.username': username }, { 'auth.local': 1 });
    expect(user).toBeFalsy();
  });
});
