import supertest from 'supertest';
import { expect } from 'chai';

import app from 'server';
import 'db/connect';
import Article from './article.model';
import ArticleBrand from './brand/model';

const request = supertest.agent(app.listen());

describe('Articles api', () => {
  before(async () => {
    // Populating DB with articles.
    const articleBrand = await new ArticleBrand({ name: 'Wir' }).save();
    const promises = [];
    for (let i = 1; i < 9; i++) {
      const date = new Date(`2017-11-0${i}T18:25:43.511Z`);
      promises.push(
        new Article({
          title: `Api testing ${i} tit.`,
          subtitle: `Api testing ${i} sub.`,
          // eslint-disable-next-line no-underscore-dangle
          brand: articleBrand._id,
          type: 'text',
          slug: `article-${i}`,
          createdAt: date,
          publishAt: date,
        }).save()
      );
    }
    await Promise.all(promises);
  });

  after(async () => {
    await ArticleBrand.remove({ name: 'Wir' });

    const promises = [];
    for (let i = 1; i < 9; i++) {
      promises.push(Article.remove({ slug: `article-${i}` }));
    }
    await Promise.all(promises);
  });

  describe('# get newest articles with pagination', () => {
    it('should return 4 articles from the first page', () =>
      request
        .get('/api/articles?page=0&pageSize=4')
        .expect(200)
        .then(({ body: { data } }) => {
          expect(data).has.length(4);
          expect(data[0].slug).to.equal('article-8');
          expect(data[3].slug).to.equal('article-5');
        }));
  });

  describe('# filter articles with publishAt attribute', () => {
    before(async () => {
      const articleBrand = await ArticleBrand.findOne({ name: 'Wir' });
      await new Article({
        title: 'test title 1',
        subtitle: 'test subtitle 1',
        slug: 'publishAt-article-1',
        // eslint-disable-next-line no-underscore-dangle
        brand: articleBrand._id,
        type: 'text',
        publishAt: new Date('2025-01-01T18:25:43.511Z'),
      }).save();
    });

    after(async () => {
      await Article.remove({ slug: 'publishAt-article-1' });
    });

    it('should return 8 published articles and skip 1 unpublished', () =>
      request
        .get('/api/articles')
        .expect(200)
        .then(({ body: { data } }) => {
          expect(data).has.length(8);
          expect(data.map(({ slug }) => slug)).not.includes('publishAt-article-1');
        }));
  });
});
