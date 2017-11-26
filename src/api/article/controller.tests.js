import supertest from 'supertest';
import { expect } from 'chai';

import app from 'server';
import 'db/connect';
import Article from './article.model';
import ArticleType from './type.model';

const request = supertest.agent(app.listen());

describe('Articles api', () => {
  describe('# get all articles with pagination', () => {
    before(async () => {
      const articleType = await ArticleType.findOne({ name: 'Wir' });
      const promises = [];
      for (let i = 1; i < 9; i++) {
        promises.push(
          new Article({
            title: `Api testing ${i} tit.`,
            subtitle: `Api testing ${i} sub.`,
            // eslint-disable-next-line no-underscore-dangle
            type: articleType._id,
            slug: `article-${i}`,
            createdAt: new Date(`2015-01-0${i}T18:25:43.511Z`),
          }).save()
        );
      }
      await Promise.all(promises);
    });

    after(async () => {
      const promises = [];
      for (let i = 1; i < 9; i++) {
        promises.push(Article.remove({ slug: `article-${i}` }));
      }
      await Promise.all(promises);
    });

    it('should return 5 articles from third page', () =>
      request
        .get('/api/articles?page=2&pageSize=4')
        .expect(200)
        .then(({ body: { data } }) => {
          expect(data).has.length(4);
          expect(data[0].slug).to.equal('article-5');
          expect(data[3].slug).to.equal('article-2');
        }));
  });

  describe('# filter articles with publishAt attribute', () => {
    before(async () => {
      const articleType = await ArticleType.findOne({ name: 'Wir' });
      await new Article({
        title: 'test title 1',
        subtitle: 'test subtitle 1',
        slug: 'publishAt-article-1',
        // eslint-disable-next-line no-underscore-dangle
        type: articleType._id,
        publishAt: new Date('2025-01-01T18:25:43.511Z'),
      }).save();
    });

    after(async () => {
      await Article.remove({ slug: 'publishAt-article-1' });
    });

    it('should return only 5 initial published articles', () =>
      request
        .get('/api/articles')
        .expect(200)
        .then(({ body: { data } }) => {
          expect(data).has.length(5);
          expect(data.map(({ slug }) => slug)).not.includes('publishAt-article-1');
        }));
  });
});
