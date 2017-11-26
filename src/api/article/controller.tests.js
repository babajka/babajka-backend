import supertest from 'supertest';
import { expect } from 'chai';

import app from 'server';
import 'db/connect';
import Article from './article.model';

const request = supertest.agent(app.listen());

describe('Articles api', () => {
  describe('# get all articles with pagination', () => {
    before(async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push((new Article({
          title: `Api testing ${i} tit.`,
          subtitle: `Api testing ${i} sub.`,
          slug: `article-${i}`,
        })).save());
      }
      await Promise.all(promises);
    });

    after(async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(Article.remove({ slug: `article-${i}` }));
      }
      await Promise.all(promises);
    });

    // TODO(@anstr): check order, sort articles by date
    it('should return 4 first articles', () =>
      request.get('/api/articles?page=0&pageSize=4')
        .expect(200)
        .then((res) => {
          expect(res.body.data).has.length(4);
        })
    );
  });

  describe('# filter articles with publishAt attribute', () => {
    before(async () => {
      const promises = [];
      promises.push((new Article({
        title: 'test title 0',
        subtitle: 'test subtitle 0',
        slug: 'article-0',
        publishAt: new Date('2015-01-01T18:25:43.511Z'),
      })).save());
      promises.push((new Article({
        title: 'test title 1',
        subtitle: 'test subtitle 1',
        slug: 'article-1',
        publishAt: new Date('2025-01-01T18:25:43.511Z'),
      })).save());
      await Promise.all(promises);
    });

    after(async () => {
      const promises = [];
      for (let i = 0; i < 2; i++) {
        promises.push(Article.remove({ slug: `article-${i}` }));
      }
      await Promise.all(promises);
    });

    it('should return the first article', () =>
      request.get('/api/articles?pageSize=1')
        .expect(200)
        .then((res) => {
          expect(res.body.data).has.length(1);
          expect(res => {
            if (!res.body.data[0].publishAt) {
              throw new Error('missing publishAt attribute');
            }
            if (res.body.data[0].publishAt > Date.now()) {
              throw new Error('bad publishAt filtering');
            }
          });
        })
    );
  });
});
