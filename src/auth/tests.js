import supertest from 'supertest';
import { expect } from 'chai';

import app from 'server';
import 'db/connect';
import { requireAuth } from 'auth';

import { dropData, loginDefaultAdmin } from 'utils/testing';

const request = supertest.agent(app.listen());

app.get('/protected', requireAuth, (req, res) => res.sendStatus(200));

describe('Auth API', () => {
  let sessionCookie;
  before(async () => {
    sessionCookie = await loginDefaultAdmin();
  });

  after(dropData);

  it('should fail to get protected resource without authorization', () =>
    request.get('/protected').expect(403));

  it('should fail to login with incorrect password', () =>
    request
      .post('/auth/login')
      .send({ email: 'admin@babajka.io', password: 'some-random-text' })
      .expect(400)
      .then(res => {
        expect(res.body.error).to.have.property('password');
      }));

  it('should fail to logout without authorization', () => request.get('/auth/logout').expect(403));

  it('should access protected resource', () =>
    request
      .get('/protected')
      .set('Cookie', sessionCookie)
      .expect(200));

  it('should logout with 200', () =>
    request
      .get('/auth/logout')
      .set('Cookie', sessionCookie)
      .expect(200));

  it('should fail to access protected resource', () => request.get('/protected').expect(403));

  it('should register successfully', () =>
    request
      .post('/auth/register')
      .send({
        firstName: 'Name',
        lastName: 'Last',
        email: 'test2@babajka.io',
        password: 'password',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.displayName).to.equal('Name Last');
        expect(body.email).to.equal('test2@babajka.io');
      }));
});
