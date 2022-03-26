import supertest from 'supertest';

import app from '../server.js';

describe('Testing protection of routes', () => {
  it('Testing unprotected route', async () => {
    await supertest(app).get('/unprotected')
      .expect(200, 'Gud');
  });
  it('Testing protected route', async () => {
    await supertest(app).get('/protected')
      .expect(302);
  });
});
