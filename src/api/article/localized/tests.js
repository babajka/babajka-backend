import { supertest, expect, dropData, loginTestAdmin } from 'utils/testing';

import app from 'server';
import 'db/connect';

import Article from 'api/article/article.model';
import ArticleBrand from 'api/article/brand/model';

const request = supertest.agent(app.listen());

describe('Locales API', () => {
  let sessionCookie;
  let articleId;

  before(async () => {
    const brand = await ArticleBrand({ slug: 'test' }).save();

    const article = await Article({
      brand: brand._id,
      imagePreviewUrl: 'image-url',
      type: 'text',
      publishAt: Date.now(),
    }).save();

    articleId = article._id;
    sessionCookie = await loginTestAdmin();
  });

  after(dropData);

  describe('# Locales CRUD', () => {
    it('should fail to add locale due to lack of permissions', () =>
      request.post(`/api/articles/localize/${articleId}`).expect(403));

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
