import HttpStatus from 'http-status-codes';

import { supertest, expect, dropData, addAdminUser } from 'utils/testing';
import * as permissions from 'constants/permissions';

import app from 'server';
import 'db/connect';
import { requireAuth } from 'auth';

const request = supertest.agent(app.listen());

app.get('/protected', requireAuth, (req, res) => res.sendStatus(HttpStatus.OK));

describe('Auth API', () => {
  // eslint-disable-next-line func-names
  before(async function() {
    this.timeout(5000);
    await dropData();

    await addAdminUser();
  });

  after(dropData);

  it('should fail to get protected resource without authorization', () =>
    request.get('/protected').expect(HttpStatus.FORBIDDEN));

  it('should fail to login with incorrect password', () =>
    request
      .post('/auth/login')
      .send({ email: 'admin@babajka.io', password: 'some-random-text' })
      .expect(HttpStatus.BAD_REQUEST)
      .then(({ body }) => {
        expect(body.error).to.have.property('password');
      }));

  it('should fail to logout without authorization', () =>
    request.get('/auth/logout').expect(HttpStatus.FORBIDDEN));

  let sessionCookie;

  it('should login successfully as admin', () =>
    request
      .post('/auth/login')
      .send({ email: 'admin@babajka.io', password: 'password' })
      .expect(HttpStatus.OK)
      .then(({ body: { user }, headers }) => {
        expect(user.email).to.equal('admin@babajka.io');
        expect(headers['set-cookie']).not.empty();
        sessionCookie = headers['set-cookie'];
        expect(Object.keys(user.permissions)).to.have.length(Object.keys(permissions.admin).length);
      }));

  it('should access protected resource', () =>
    request
      .get('/protected')
      .set('Cookie', sessionCookie)
      .expect(HttpStatus.OK));

  it('should logout with 200', () =>
    request
      .get('/auth/logout')
      .set('Cookie', sessionCookie)
      .expect(HttpStatus.OK));

  it('should fail to access protected resource', () =>
    request.get('/protected').expect(HttpStatus.FORBIDDEN));

  it('should register successfully', () =>
    request
      .post('/auth/register')
      .send({
        firstName: 'Name',
        lastName: 'Last',
        email: 'test2@babajka.io',
        password: 'password',
      })
      .expect(HttpStatus.OK)
      .expect(({ body: { user } }) => {
        expect(user.displayName).to.equal('Name Last');
        expect(user.email).to.equal('test2@babajka.io');
        expect(user.permissions).to.be.not.undefined();
        expect(user.permissions).to.be.empty();
      }));
});
