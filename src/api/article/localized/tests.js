import supertest from 'supertest';
import { expect } from 'chai';

import app from 'server';
import 'db/connect';

import Article from 'api/article/article.model';
import ArticleBrand from 'api/article/brand/model';
import User from 'api/user/model';

import LocalizedArticle from './model';

const request = supertest.agent(app.listen());

describe('Locales API', () => {
  let articleId;

  before(async () => {
    const brand = await ArticleBrand({ name: 'test' }).save();

    const article = await Article({
      brand: brand._id,
      type: 'text',
    }).save();

    articleId = article._id;

    const user = new User({
      email: 'admin1@babajka.io',
      permissions: { canCreateArticle: true, canManageArticles: true },
    });
    await user.setPassword('password');
    await user.save();
  });

  after(async () => {
    await Promise.all([
      ArticleBrand.remove(),
      Article.remove(),
      LocalizedArticle.remove(),
      User.remove(),
    ]);
  });

  describe('# Locales CRUD', () => {
    it('should fail to add locale due to lack of permissions', () =>
      request.post(`/api/articles/localize/${articleId}`).expect(401));

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

    it('should add EN locale into the article', () =>
      request
        .post(`/api/articles/localize/${articleId}`)
        .set('Cookie', sessionCookie)
        .send({
          slug: 'slug-en',
          title: 'Title EN',
          subtitle: 'Subtitle EN',
          locale: 'en',
        })
        .expect(200)
        .expect(res => {
          expect(res.body.slug).to.equal('slug-en');
        }));

    it('should return article with only EN locale', () =>
      request
        .get('/api/articles/slug-en')
        .expect(200)
        .expect(res => {
          expect(Object.keys(res.body.locales)).has.length(1);
          expect(res.body.locales.en.slug).equals('slug-en');
        }));

    it('should fail to create another EN localization', () =>
      request
        .post(`/api/articles/localize/${articleId}`)
        .set('Cookie', sessionCookie)
        .send({
          slug: 'slug-en2',
          title: 'another title',
          subtitle: 'another subtitle',
          locale: 'en',
        })
        .expect(400));

    it('should update an existing EN locale', () =>
      request
        .put('/api/articles/localize/slug-en')
        .set('Cookie', sessionCookie)
        .send({ title: 'new-title' })
        .expect(200)
        .expect(res => expect(res.body.title).to.equal('new-title')));
  });
});
