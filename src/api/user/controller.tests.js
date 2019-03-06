import HttpStatus from 'http-status-codes';

import { supertest, expect, dropData, loginTestAdmin, TEST_DATA } from 'utils/testing';

import app from 'server';
import 'db/connect';

const request = supertest.agent(app.listen());

describe('Users API', () => {
  let sessionCookie;

  before(async () => {
    await dropData();

    sessionCookie = await loginTestAdmin();
  });

  it('should return null user without authorization', () =>
    request
      .get('/api/users/current')
      .expect(HttpStatus.OK)
      .then(({ body: { user } }) => {
        expect(user).to.be.null();
      }));

  it('should return current user', () =>
    request
      .get('/api/users/current')
      .set('Cookie', sessionCookie)
      .expect(HttpStatus.OK)
      .then(({ body: { user } }) => {
        expect(user).to.not.null();
        expect(user.email).to.equal(TEST_DATA.users.admin.email);
      }));

  it('should return 403 instead all users without authorization', () =>
    request.get('/api/users').expect(HttpStatus.FORBIDDEN));

  it('should return all users', () =>
    request
      .get('/api/users')
      .set('Cookie', sessionCookie)
      .expect(HttpStatus.OK)
      .then(({ body }) => {
        expect(body).have.length(1);
        expect(body[0].email).to.equal(TEST_DATA.users.admin.email);
      }));
});
