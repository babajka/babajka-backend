import { supertest, expect, dropData, loginTestAdmin } from 'utils/testing';

import app from 'server';
import 'db/connect';

const request = supertest.agent(app.listen());

describe('Storage API', () => {
  let sessionCookie;

  before(async () => {
    sessionCookie = await loginTestAdmin();
  });

  after(dropData);

  it('should create a new storage entity with public access', () =>
    request
      .post('/api/storage/public/public-entity')
      .set('Cookie', sessionCookie)
      .send({
        a: 'b',
        c: ['d', 'e'],
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).not.empty();
        expect(body.a).to.equal('b');
        expect(body.c).has.length(2);
      }));

  it('should fail to auth when retrieving public entity as protected with no auth', () =>
    request.get('/api/storage/protected/public-entity').expect(403));

  it('should fail to retrieve public entity as protected with auth', () =>
    request
      .get('/api/storage/protected/public-entity')
      .set('Cookie', sessionCookie)
      .expect(404));

  it('should retrieve a public storage entity', () =>
    request
      .get('/api/storage/public/public-entity')
      .expect(200)
      .expect(({ body }) => {
        expect(body.a).to.equal('b');
      }));

  it('should create a new storage entity with protected access', () =>
    request
      .post('/api/storage/protected/protected-entity')
      .set('Cookie', sessionCookie)
      .send({
        x: 'y',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).not.empty();
        expect(body.x).to.equal('y');
      }));

  it('should fail to retrieve protected entity without auth', () =>
    request.get('/api/storage/protected/protected-entity').expect(403));

  it('should retrieve a protected storage entity', () =>
    request
      .get('/api/storage/protected/protected-entity')
      .set('Cookie', sessionCookie)
      .expect(200)
      .expect(({ body }) => {
        expect(body).not.empty();
        expect(body.x).to.equal('y');
      }));

  it('should make a protected entity public', () =>
    request
      .post('/api/storage/public/protected-entity')
      .set('Cookie', sessionCookie)
      .expect(200));

  it('should retrieve an updated public storage entity', () =>
    request
      .get('/api/storage/public/protected-entity')
      .expect(200)
      .expect(({ body }) => {
        expect(body).not.empty();
        expect(body.x).to.equal('y');
      }));

  it('should update a document', () =>
    request
      .post('/api/storage/public/protected-entity')
      .set('Cookie', sessionCookie)
      .send({ x: 'z' })
      .expect(200));

  it('should retrieve a storage entity with updated document', () =>
    request
      .get('/api/storage/public/protected-entity')
      .expect(200)
      .expect(({ body }) => {
        expect(body).not.empty();
        expect(body.x).to.equal('z');
      }));
});
