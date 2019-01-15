import { supertest, expect, dropData, addAdminUser } from 'utils/testing';
import * as permissions from 'constants/permissions';

import app from 'server';
import 'db/connect';
import { requireAuth } from 'auth';

const request = supertest.agent(app.listen());

app.get('/protected', requireAuth, (req, res) => res.sendStatus(200));

describe('Auth API', () => {
  before(async () => {
    await addAdminUser();
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

  let sessionCookie;

  it('should login successfully as admin', () =>
    request
      .post('/auth/login')
      .send({ email: 'admin@babajka.io', password: 'password' })
      .expect(200)
      .then(res => {
        expect(res.body.email).to.equal('admin@babajka.io');
        expect(res.headers['set-cookie']).not.empty();
        sessionCookie = res.headers['set-cookie'];
        expect(Object.keys(res.body.permissions)).to.have.length(
          Object.keys(permissions.admin).length
        );
      }));

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
        expect(body.permissions).to.be.not.undefined();
        expect(body.permissions).to.be.empty();
      }));
});
