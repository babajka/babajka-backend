/* eslint-disable comma-dangle */
import supertest from 'supertest';
import { expect } from 'chai';

import app from 'server';
import 'db/connect';

const request = supertest.agent(app.listen());
let cookie;

describe('Auth', () => {
  describe('# api require Auth', () =>
    it('should respond with 401 Unauthorized', () =>
      request.get('/api/users').expect(401)
    ));

  describe('# login with incorrect password', () =>
    it('should respond with 400 and error message', () =>
      request.post('/auth/login')
        .send({ email: 'admin@babajka.io', password: '1' })
        .expect(400)
        .then(res => expect(res.body).to.have.property('password'))
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

  describe('# api with cookies', () =>
    it('should respond with 200, with cookies token', () =>
      request.get('/api/users')
        .set('Cookie', cookie)
        .expect(200)
    ));

  describe('# logout', () =>
    it('should respond with 200', () =>
      request.get('/api/logout')
        .set('Cookie', cookie)
        .expect(200)
    ));

  describe('# api after logout', () =>
    it('should respond with 401 Unauthorized', () =>
      request.get('/api/users').expect(401)
    ));
});
