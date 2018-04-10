import supertest from 'supertest';
import { expect } from 'chai';
import { User } from 'api/user';

import app from 'server';
import 'db/connect';
import { requireAuth } from 'auth';

import { dropData } from 'utils/testing';

const request = supertest.agent(app.listen());

app.get('/protected', requireAuth, (req, res) => res.sendStatus(200));

describe('Auth API', () => {
  const usersData = [
    {
      firstName: 'Name',
      email: 'test1@babajka.io',
      password: 'password',
    },
  ];

  before(async () => {
    await Promise.all(
      usersData.map(async userData => {
        const user = new User(userData);
        await user.setPassword(userData.password);
        return user.save();
      })
    );
  });

  after(dropData);

  it('should fail to get protected resource without authorization', () =>
    request.get('/protected').expect(403));

  it('should fail to login with incorrect password', () =>
    request
      .post('/auth/login')
      .send({ email: 'test1@babajka.io', password: '1' })
      .expect(400)
      .then(res => {
        expect(res.body.error).to.have.property('password');
      }));

  it('should fail to logout without authorization', () => request.get('/auth/logout').expect(403));

  let cookie;

  it('should login and set cookie', () =>
    request
      .post('/auth/login')
      .send({ email: 'test1@babajka.io', password: 'password' })
      .expect(200)
      .then(res => {
        // eslint-disable-next-line no-unused-expressions
        expect(res.headers['set-cookie']).not.empty;
        [cookie] = res.headers['set-cookie'];
        expect(cookie).contains('connect.sid');
        expect(res.body.email).equal('test1@babajka.io');
      }));

  it('should access protected resource', () =>
    request
      .get('/protected')
      .set('Cookie', cookie)
      .expect(200));

  it('should logout with 200', () =>
    request
      .get('/auth/logout')
      .set('Cookie', cookie)
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
