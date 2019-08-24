import 'db/connect';
import HttpStatus from 'http-status-codes';

import {
  supertest,
  expect,
  dropData,
  loginTestAdmin,
  defaultObjectMetadata,
  TEST_DATA,
} from 'utils/testing';

import app from 'server';
import Article from 'api/article/article.model';
import { mapIds } from 'utils/getters';

import ArticleCollection from './model';

const request = supertest.agent(app.listen());

const NEW_IMAGE_URL = 'https://new-image-url.jpg';
const NEW_IMAGE_URL2 = 'https://new-image-url2.jpg';

describe('Collections API', () => {
  let sessionCookie;

  before(async function() {
    this.timeout(5000);
    await dropData();

    sessionCookie = await loginTestAdmin();
    const defaultMetadata = await defaultObjectMetadata();

    // Populating DB with Collections.
    const articlePromises = [];
    for (let i = 1; i <= 5; i += 1) {
      articlePromises.push(
        new Article({
          type: 'text',
          images: TEST_DATA.articleImages.text,
          metadata: defaultMetadata,
        }).save()
      );
    }
    await Promise.all(articlePromises);

    const articles = await Article.find().exec();
    const articlesIds = mapIds(articles);

    const promises = [];
    for (let i = 1; i <= 5; i += 1) {
      promises.push(
        new ArticleCollection({
          name: { be: `Калекцыя ${i}`, en: `Collection ${i}` },
          description: { be: `апісанне`, en: `a description` },
          slug: `collection-${i}`,
          articles: articlesIds[i - 1],
          imageUrl: NEW_IMAGE_URL,
        }).save()
      );
    }
    await Promise.all(promises);
  });

  describe('# Collections CRUD', () => {
    it('should return 5 collections', () =>
      request
        .get('/api/articles/collections')
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body).has.length(5);
        }));

    it('should return a collection', () =>
      request
        .get('/api/articles/collections/collection-2')
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.slug).equals('collection-2');
        }));

    it('should not found a collection', () =>
      request.get('/api/articles/collections/collection-12').expect(HttpStatus.NOT_FOUND));

    it('should fail to create a collection due to lack of permissions', () =>
      request.post('/api/articles/collections').expect(HttpStatus.FORBIDDEN));

    it('should fail to update a collection due to lack of permissions', () =>
      request
        .put('/api/articles/collections/collection-1')
        .send({ description: 'a completely new description' })
        .expect(HttpStatus.FORBIDDEN));

    it('should fail to remove a collection due to lack of permissions', () =>
      request.delete('/api/articles/collections/collection-1').expect(HttpStatus.FORBIDDEN));

    it('should create a new collection', () =>
      request
        .post('/api/articles/collections')
        .set('Cookie', sessionCookie)
        .send({
          slug: 'collection-6',
          name: { be: 'New Collection' },
          imageUrl: NEW_IMAGE_URL,
        })
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.slug).equals('collection-6');
        }));

    it('should include a newly created collection', () =>
      request
        .get('/api/articles/collections')
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body).has.length(6);
        }));

    it('should associate regular article with the collection', () =>
      request
        .post('/api/articles/')
        .set('Cookie', sessionCookie)
        .send({
          type: 'text',
          images: {
            ...TEST_DATA.articleImages.text,
            vertical: NEW_IMAGE_URL,
          },
          publishAt: Date.now(),
          collectionSlug: 'collection-6',
          locales: {
            be: {
              title: 'title',
              subtitle: 'subtitle',
              slug: 'slug-new1-be',
              text: { content: 'some text' },
            },
          },
        })
        .expect(HttpStatus.OK)
        .expect(({ body: { images, locales } }) => {
          expect(images.vertical).equals(NEW_IMAGE_URL);
          expect(locales.be.slug).equals('slug-new1-be');
        }));

    it('should associate postponed article with the collection', () =>
      request
        .post('/api/articles/')
        .set('Cookie', sessionCookie)
        .send({
          type: 'text',
          images: {
            ...TEST_DATA.articleImages.text,
            vertical: NEW_IMAGE_URL2,
          },
          publishAt: new Date('2025-01-01T18:25:43.511Z'),
          collectionSlug: 'collection-6',
          locales: {
            be: {
              title: 'title',
              subtitle: 'subtitle',
              text: { content: 'text' },
              slug: 'slug-new2-be',
            },
          },
        })
        .expect(HttpStatus.OK)
        .expect(({ body: { images, locales } }) => {
          expect(images.vertical).equals(NEW_IMAGE_URL2);
          expect(locales.be.slug).equals('slug-new2-be');
        }));

    it('should return both articles in the collection when querying with permissions', () =>
      request
        .get('/api/articles/collections/collection-6')
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.slug).equals('collection-6');
          expect(body.articles).has.length(2);
          expect(body.articles[0].images.vertical).equals(NEW_IMAGE_URL);
          expect(body.articles[1].images.vertical).equals(NEW_IMAGE_URL2);
        }));

    it('should return only article in the collection when querying without permissions', () =>
      request
        .get('/api/articles/collections/collection-6')
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.slug).equals('collection-6');
          expect(body.articles).has.length(1);
          expect(body.articles[0].images.vertical).equals(NEW_IMAGE_URL);
        }));

    it('should return collection.next when querying with permissions', () =>
      request
        .get('/api/articles/slug-new1-be')
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.locales.be.slug).equals('slug-new1-be');
          expect(body.collection.slug).equals('collection-6');
          expect(body.collection.next.locales.be.slug).equals('slug-new2-be');
        }));

    it('should not return collection.next when querying without permissions', () =>
      request
        .get('/api/articles/slug-new1-be')
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.collection.next).to.be.null();
        }));

    it('should return collection.prev when querying with permissions', () =>
      request
        .get('/api/articles/slug-new2-be')
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.locales.be.slug).equals('slug-new2-be');
          expect(body.collection.slug).equals('collection-6');
          expect(body.collection.prev.locales.be.slug).equals('slug-new1-be');
        }));

    it('should remove a collection', () =>
      request
        .delete('/api/articles/collections/collection-6')
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK));

    it('should not return a removed collection', () =>
      request
        .get('/api/articles/collections')
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body).has.length(5);
        }));

    it('should recover a collection using update', () =>
      request
        .put('/api/articles/collections/collection-6')
        .send({ active: true, description: { en: 'desc-new' } })
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.slug).equals('collection-6');
          expect(body.description.en).equals('desc-new');
        }));

    it('should return a recovered collection', () =>
      request
        .get('/api/articles/collections')
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body).has.length(6);
          expect(body.map(({ slug }) => slug)).to.include('collection-6');
        }));

    it('should change the collection for the article', () =>
      request
        .put('/api/articles/slug-new2-be')
        .send({
          collectionSlug: 'collection-5',
        })
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.collection.slug).equals('collection-5');
        }));

    it('should remove an article from the old collection', () =>
      request
        .get('/api/articles/collections/collection-6')
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.slug).equals('collection-6');
          expect(body.articles).has.length(1);
          expect(body.articles[0].locales.be.slug).equals('slug-new1-be');
        }));

    it('should add an article into a new collection', () =>
      request
        .get('/api/articles/collections/collection-5')
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.slug).equals('collection-5');
          expect(body.articles).has.length(2);
          expect(body.articles[1].locales.be.slug).equals('slug-new2-be');
        }));
  });
});
