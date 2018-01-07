import supertest from 'supertest';
import { expect } from 'chai';

import app from 'server';
import 'db/connect';
import User from 'api/user/model';
import Article from './article.model';
import ArticleBrand from './brand/model';

const request = supertest.agent(app.listen());

describe('Articles API', () => {
  let articleBrandId;

  before(async () => {
    // Populating DB with articles.
    const articleBrand = await new ArticleBrand({ name: 'Wir' }).save();
    articleBrandId = articleBrand._id;
    const promises = [];
    for (let i = 1; i <= 8; i++) {
      const date = new Date(`2017-11-0${i}T18:25:43.511Z`);
      promises.push(
        new Article({
          title: `Api testing ${i} tit.`,
          subtitle: `Api testing ${i} sub.`,
          brand: articleBrand._id,
          type: 'text',
          slug: `article-${i}`,
          createdAt: date,
          publishAt: date,
        }).save()
      );
    }
    // An article with post publishing.
    promises.push(
      new Article({
        title: 'test title 1',
        subtitle: 'test subtitle 1',
        slug: 'publishAt-article-1',
        brand: articleBrand._id,
        type: 'text',
        publishAt: new Date('2025-01-01T18:25:43.511Z'),
      }).save()
    );
    await Promise.all(promises);

    const user = new User({
      email: 'admin1@babajka.io',
      permissions: { canCreateArticle: true, canManageArticles: true },
    });
    await user.setPassword('password');
    await user.save();
  });

  after(async () => {
    const promises = [];
    for (let i = 1; i < 9; i++) {
      promises.push(Article.remove({ slug: `article-${i}` }));
    }
    promises.push(ArticleBrand.remove({ name: 'Wir' }));
    promises.push(User.remove({ email: 'admin1@babajka.io' }));
    await Promise.all(promises);
  });

  describe('# Articles CRUD', () => {
    it('should return 4 articles from the first page', () =>
      request
        .get('/api/articles?page=0&pageSize=4')
        .expect(200)
        .expect(res => {
          expect(res.body.data).has.length(4);
          expect(res.body.data[0].slug).to.equal('article-8');
          expect(res.body.data[3].slug).to.equal('article-5');
        }));

    it('should return 8 published articles and skip 1 unpublished', () =>
      request
        .get('/api/articles')
        .expect(200)
        .expect(res => {
          expect(res.body.data).has.length(8);
          expect(res.body.data.map(({ slug }) => slug)).not.includes('publishAt-article-1');
        }));

    it('should return an article by slug', () =>
      request
        .get('/api/articles/article-2')
        .expect(200)
        .expect(res => {
          expect(res.body.slug).equal('article-2');
        }));

    it('should not return with bad slug', () =>
      request.get('/api/articles/article-not-found').expect(404));

    it('should not return unpublished', () =>
      request.get('/api/articles/publishAt-article-1').expect(404));

    it('should fail to create an article due to lack of permissions', () =>
      request.post('/api/articles').expect(401));

    it('should fail to update an article due to lack of permissions', () =>
      request.put('/api/articles/article-1').expect(401));

    it('should fail to remove an article due to lack of permissions', () =>
      request.delete('/api/articles/article-1').expect(401));

    let sessionCookie;

    it('should login as admin successfully', () =>
      request
        .post('/auth/login')
        .send({ email: 'admin1@babajka.io', password: 'password' })
        .expect(200)
        .then(res => {
          // eslint-disable-next-line no-unused-expressions
          expect(res.headers['set-cookie']).not.empty;
          [sessionCookie] = res.headers['set-cookie'];
          expect(res.body.email).equal('admin1@babajka.io');
        }));

    it('should return 9 articles (published and unpublished)', () =>
      request
        .get('/api/articles')
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          expect(res.body.data).has.length(9);
          expect(res.body.data.map(({ slug }) => slug)).includes('publishAt-article-1');
        }));

    it('should return unpublished', () =>
      request
        .get('/api/articles/publishAt-article-1')
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          expect(res.body.slug).equal('publishAt-article-1');
        }));

    it('should create an article', () =>
      request
        .post('/api/articles')
        .set('Cookie', sessionCookie)
        .send({
          title: 'title',
          subtitle: 'subtitle',
          brand: articleBrandId,
          type: 'text',
          slug: 'article-new',
        })
        .expect(200)
        .expect(res => {
          expect(res.body.slug).equal('article-new');
        }));

    it('should contain a newly created article', () =>
      request
        .get('/api/articles')
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          expect(res.body.data).has.length(10);
          expect(res.body.data.map(({ slug }) => slug)).includes('article-new');
        }));

    it('should update an article', () =>
      request
        .put('/api/articles/article-new')
        .send({
          title: 'title-new',
          subtitle: 'subtitle-new',
        })
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          expect(res.body.title).equal('title-new');
          expect(res.body.subtitle).equal('subtitle-new');
        }));

    it('should remove an article', () =>
      request
        .delete('/api/articles/article-new')
        .set('Cookie', sessionCookie)
        .expect(200));

    it('should not contain a removed article', () =>
      request
        .get('/api/articles')
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          expect(res.body.data).has.length(9);
        }));
  });
});
