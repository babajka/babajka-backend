import { supertest, expect, dropData } from 'utils/testing';

import app from 'server';
import 'db/connect';

import ArticleBrand from './model';

const request = supertest.agent(app.listen());

describe('Brands API', () => {
  const brandSlugs = ['wir', 'kurilka', 'minsk'];

  before(async () => {
    await dropData();

    const promises = brandSlugs.map(brandSlug => new ArticleBrand({ slug: brandSlug }).save());
    await Promise.all(promises);
  });

  describe('# get full list of brands', () => {
    it('should return all brands from the list', () =>
      request
        .get('/api/articles/brands')
        .expect(200)
        .expect(({ body }) => {
          expect(body).has.length(brandSlugs.length);
        }));
  });
});
