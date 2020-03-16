import HttpStatus from 'http-status-codes';

import { supertest, expect, loginTestAdmin, dropData } from 'utils/testing';

import app from 'server';

const request = supertest.agent(app.listen());

describe('Fibery State Constructors', () => {
  let sessionCookie;

  before(async () => {
    dropData();
    sessionCookie = await loginTestAdmin();
  });

  it('should fail to process sidebar state [tag is not in database]', () =>
    request
      .post('/api/storage/fibery/sidebar')
      .set('Cookie', sessionCookie)
      .expect(HttpStatus.NOT_FOUND)
      .expect(({ body }) => {
        expect(body).not.empty();
        expect(body.error).not.empty();
        expect(body.error).to.contain('no tag in database');
      }));

  it('should fail to process main page state [article or tag is not in database]', () =>
    request
      .post('/api/storage/fibery/main-page')
      .set('Cookie', sessionCookie)
      .expect(HttpStatus.NOT_FOUND)
      .expect(({ body }) => {
        expect(body).not.empty();
        expect(body.error).not.empty();
        expect(body.error).to.contain('no');
      }));
});
