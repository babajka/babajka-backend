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
});
