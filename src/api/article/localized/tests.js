import {
  supertest,
  expect,
  dropData,
  loginTestAdmin,
  defaultObjectMetadata,
  addBrand,
  TEST_DATA,
} from 'utils/testing';

import app from 'server';
import 'db/connect';

import Article from 'api/article/article.model';

const request = supertest.agent(app.listen());

describe('Locales API', () => {
  let sessionCookie;
  let articleId;

  before(async () => {
    await dropData();

    const { _id: articleBrandId } = await addBrand();

    sessionCookie = await loginTestAdmin();

    const defaultMetadata = await defaultObjectMetadata();

    const article = await Article({
      brand: articleBrandId,
      type: 'text',
      images: TEST_DATA.articleImages.text,
      metadata: defaultMetadata,
      publishAt: Date.now(),
    }).save();

    articleId = article._id;
  });

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
        .expect(({ body }) => {
          expect(body.slug).to.equal('slug-en');
        }));

    it('should return article with only EN locale', () =>
      request
        .get('/api/articles/slug-en')
        .expect(200)
        .expect(({ body: { locales } }) => {
          expect(Object.keys(locales)).has.length(1);
          expect(locales.en.slug).equals('slug-en');
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
        .expect(({ body }) => expect(body.title).to.equal('new-title')));
  });
});
