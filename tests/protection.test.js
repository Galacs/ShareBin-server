import supertest from 'supertest';

import app, { db } from '../server.js';

afterAll(async () => {
  await db.disconnect();
});

describe('Testing protection of routes', () => {
  it('Testing unprotected route', async () => {
    await supertest(app).get('/unprotected')
      .expect(200, 'Gud');
  });
  it('Testing protected route', async () => {
    await supertest(app).get('/protected')
      .expect(401, 'Unauthorized');
  });
});