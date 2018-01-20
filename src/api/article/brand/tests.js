import supertest from 'supertest';
import { expect } from 'chai';

import app from 'server';
import 'db/connect';

import { dropData } from 'utils/testing';

import ArticleBrand from './model';

const request = supertest.agent(app.listen());

describe('Brands API', () => {
  const brands = ['Wir', 'Kurilka', 'Minsk'];

  before(async () => {
    const promises = brands.map(brand => new ArticleBrand({ slug: brand }).save());
    await Promise.all(promises);
  });

  after(dropData);

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
