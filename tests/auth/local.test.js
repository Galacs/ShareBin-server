import supertest from 'supertest';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

import app from '../../server.js';
import pool from '../../config/database.js';

describe('Testing local auth routes', () => {
  const username = crypto.randomBytes(8).toString('base64');
  const password = crypto.randomBytes(8).toString('base64');
  let user;
  let token;

  it('Testing local account creation', async () => {
    await supertest(app).post('/auth/local/register')
      .send({ username, password })
      .expect(200, { success: true });

    user = await pool.query('SELECT * FROM auth.local WHERE username = $1', [username]);
    expect(user.rows[0]).toBeTruthy();
  });

  it('Testing local account creation with same name', async () => {
    await supertest(app).post('/auth/local/register')
      .send({ username, password })
      .expect(409, { success: false, msg: 'User already exists' });

    user = await pool.query('SELECT * FROM auth.local WHERE username = $1', [username]);
    expect(user.rows[0]).toBeTruthy();
  });

  it('Testing local account login', async () => {
    await supertest(app).post('/auth/local/login')
      .send({ username, password })
      .expect(200, { success: true, username })
      .expect(async (res) => {
        // eslint-disable-next-line prefer-destructuring
        token = res.headers['set-cookie'].find((obj) => obj.startsWith('token'))
          .split('=')[1].split(';')[0];
        // eslint-disable-next-line no-underscore-dangle
        expect(JSON.stringify(user.rows[0].userid)).toBe(JSON.stringify(jwt.decode(token).sub));

        const pathToKey = path.join(path.resolve(), 'keys', 'id_rsa_pub.pem');
        const PUB_KEY = fs.readFileSync(pathToKey, 'utf8');
        expect(jwt.verify(token, PUB_KEY)).toBeTruthy();
      });
  });

  it('Testing protected route', async () => {
    await supertest(app).get(`/user-protected/${jwt.decode(token).sub}`)
      .set('Cookie', [`token=${token}`])
      .expect(200, 'nice');
  });

  it('Testing account deletion', async () => {
    await supertest(app).delete('/account')
      .set('Cookie', [`token=${token}`])
      .send({ password })
      .expect(200, { success: true, msg: 'User succesfully deleted' });

    user = await pool.query('SELECT * FROM auth.local WHERE username = $1', [username]);
    expect(user.rows[0]).toBeFalsy();
  });
});
