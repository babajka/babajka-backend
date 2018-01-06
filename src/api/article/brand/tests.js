import supertest from 'supertest';
import { expect } from 'chai';

import app from 'server';
import 'db/connect';
import ArticleBrand from './model';

const request = supertest.agent(app.listen());

describe('Brands API', () => {
  const brands = ['Wir', 'Kurilka', 'Minsk'];

  before(async () => {
    // Ensuring DB is free of any ArticleBrands.
    await ArticleBrand.remove();
    // Populating DB with Brands.
    const promises = [];
    brands.forEach(brand => promises.push(new ArticleBrand({ name: brand }).save()));
    await Promise.all(promises);
  });

  after(async () => {
    const promises = [];
    brands.forEach(brand => promises.push(ArticleBrand.remove({ name: brand })));
    await Promise.all(promises);
  });

  describe('# get full list of brands', () => {
    it('should return all brands from the list', () =>
      request
        .get('/api/articles/brands')
        .expect(200)
        .expect(res => {
          expect(res.body).has.length(brands.length);
        }));
  });
});
