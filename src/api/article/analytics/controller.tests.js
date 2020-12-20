import HttpStatus from 'http-status-codes';
import sortBy from 'lodash/sortBy';

import { supertest, expect, dropData, loginTestAdmin } from 'utils/testing';

import app from 'server';
import 'db/connect';

import ContentAnalytics from './model';

const request = supertest.agent(app.listen());

describe('Analytics API', () => {
  let sessionCookie;

  const sampleAnalyticsData = [
    { slug: 'slug1', metrics: { be: 120 } },
    { slug: 'slug2', metrics: { be: 100, ru: 10 } },
  ];

  before(async () => {
    await dropData();

    sessionCookie = await loginTestAdmin();

    await Promise.all(sampleAnalyticsData.map(data => ContentAnalytics(data).save()));
  });

  it('should fail to get analytics with no auth', () =>
    request.get('/api/analytics').expect(HttpStatus.FORBIDDEN));

  it('should get all analytics', () =>
    request
      .get('/api/analytics')
      .set('Cookie', sessionCookie)
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(sortBy(body, ['slug'])).to.deep.equal(sampleAnalyticsData);
      }));
});
