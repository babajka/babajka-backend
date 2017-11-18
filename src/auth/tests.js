import supertest from 'supertest';
import { expect } from 'chai';

import app from 'server';
import 'db/connect';
import { requireAuth } from 'auth';

const request = supertest.agent(app.listen());
let cookie;

app.get('/protected', requireAuth, (req, res) => res.sendStatus(200));

describe('Auth api', () => {
  describe('# request on protected url without authorization', () =>
    it('should respond with 401 Unauthorized', () =>
      request.get('/protected').expect(401)
    ));

  describe('# login with incorrect password', () =>
    it('should respond with 400 and error message', () =>
      request.post('/auth/login')
        .send({ email: 'admin@babajka.io', password: '1' })
        .expect(400)
        .then((res) => {
          expect(res.body).to.have.property('error');
          expect(res.body.error).to.have.property('password');
        })
    ));

  describe('# logout without authorization', () =>
    it('should respond with 401 Unauthorized', () =>
      request.get('/auth/logout').expect(401)
    ));

  describe('# login with correct credentials', () =>
    it('should respond with 200, user object and set-cookie header', () =>
      request.post('/auth/login')
        .send({ email: 'admin@babajka.io', password: 'password' })
        .expect(200)
        .then((res) => {
          // eslint-disable-next-line no-unused-expressions
          expect(res.headers['set-cookie']).not.empty;
          cookie = res.headers['set-cookie'][0];
          expect(cookie).contains('connect.sid');
          expect(res.body.email).equal('admin@babajka.io');
        })
    ));

  describe('# request on protected url with auth cookie', () =>
    it('should respond with 200, with cookies token', () =>
      request.get('/protected')
        .set('Cookie', cookie)
        .expect(200)
    ));

  describe('# logout after authorization', () =>
    it('should respond with 200', () =>
      request.get('/auth/logout')
        .set('Cookie', cookie)
        .expect(200)
    ));

  describe('# request on protected url after logout', () =>
    it('should respond with 401 Unauthorized', () =>
      request.get('/protected').expect(401)
    ));
});
