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
  let user;
  let token;
  let refreshToken;

  it('Creating account', async () => {
    await supertest(app).post('/auth/local/register')
      .send({ username, password })
      .expect(200, { success: true });

    user = await db.model('User').findOne({ 'auth.local.username': username }, { 'auth.local': 1 });
    expect(user).toBeTruthy();
  });

  it('Logging in', async () => {
    await supertest(app).post('/auth/local/login')
      .send({ username, password })
      .expect(200, { success: true, username })
      .expect(async (res) => {
        // eslint-disable-next-line prefer-destructuring
        token = res.headers['set-cookie'].find((obj) => obj.startsWith('token'))
          .split('=')[1].split(';')[0];
        // eslint-disable-next-line prefer-destructuring
        refreshToken = res.headers['set-cookie'].find((obj) => obj.startsWith('refreshToken'))
          .split('=')[1].split(';')[0];
        // eslint-disable-next-line no-underscore-dangle
        expect(JSON.stringify(user._id)).toBe(JSON.stringify(jwt.decode(token).sub));

        const pathToKey = path.join(path.resolve(), 'keys', 'id_rsa_pub.pem');
        const PUB_KEY = fs.readFileSync(pathToKey, 'utf8');
        expect(jwt.verify(token, PUB_KEY)).toBeTruthy();
      });
  });

  it('Testing protected route with token', async () => {
    await supertest(app).get(`/user-protected/${jwt.decode(token).sub}`)
      .set('Cookie', [`token=${token}`])
      .expect(200, 'nice');
  });

  it('Testing refresh redirect', async () => {
    await supertest(app).get(`/user-protected/${jwt.decode(token).sub}`)
      .expect(302)
      .expect(async (res) => {
        if (res.statusCode === 302) {
          await supertest(app).get('/auth/refresh')
            .set('Cookie', [`refreshToken=${refreshToken}`])
            .expect(302)
            .expect(async (res1) => {
              // eslint-disable-next-line prefer-destructuring
              token = res1.headers['set-cookie'].find((obj) => obj.startsWith('token'))
                .split('=')[1].split(';')[0];
            });
        }
      });
  });

  it('Testing protected route with refreshed token', async () => {
    await supertest(app).get(`/user-protected/${jwt.decode(token).sub}`)
      .set('Cookie', [`token=${token}`])
      .expect(200, 'nice');
  });

  it('Testing account deletion', async () => {
    await supertest(app).delete('/account')
      .set('Cookie', [`token=${token}`])
      .send({ password })
      .expect(200, { success: true, msg: 'User succesfully deleted' });

    user = await db.model('User').findOne({ 'auth.local.username': username }, { 'auth.local': 1 });
    expect(user).toBeFalsy();
  });
});
