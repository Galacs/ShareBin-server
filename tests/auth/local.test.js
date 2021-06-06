import supertest from 'supertest';
import crypto from 'crypto';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

import app, { db } from '../../server.js';

afterAll(async () => {
  db.connection.close();
});

describe('Testing local auth routes', () => {
  const username = crypto.randomBytes(8).toString('base64');
  const password = crypto.randomBytes(8).toString('base64');
  let user;
  let token;

  it('Testing local account creation', async () => {
    await supertest(app).post('/auth/local/register')
      .send({
        username,
        password,
      })
      .expect(200, { success: true });

    user = await mongoose.model('User').findOne({ 'auth.local.username': username }, { 'auth.local': 1 });
    expect(user).toBeTruthy();
  });

  it('Testing local account login', async () => {
    await supertest(app).post('/auth/local/login')
      .send({ username, password })
      .expect(200, { success: true })
      .expect(async (res) => {
        // eslint-disable-next-line prefer-destructuring
        token = res.headers['set-cookie'].find((obj) => obj.startsWith('token'))
          .split('=')[1].split(';')[0];
        // eslint-disable-next-line no-underscore-dangle
        expect(JSON.stringify(user._id)).toBe(JSON.stringify(jwt.decode(token).sub));
      });
  });

  it('Testing protected route', async () => {
    // eslint-disable-next-line no-underscore-dangle
    await supertest(app).get(`/user-protected/${jwt.decode(token).sub}`)
      .set('Cookie', [`token=${token}`])
      .expect(200, 'nice');
  });

  it('Testing account deletion', async () => {
    // eslint-disable-next-line no-underscore-dangle
    await supertest(app).delete('/account')
      .set('Cookie', [`token=${token}`])
      .expect(200, { success: true, msg: 'User succesfully deleted' });

    user = await mongoose.model('User').findOne({ 'auth.local.username': username }, { 'auth.local': 1 });
    expect(user).toBeFalsy();
  });
});
