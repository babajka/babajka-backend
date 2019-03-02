import HttpStatus from 'http-status-codes';

import {
  supertest,
  expect,
  dropData,
  loginTestAdmin,
  defaultObjectMetadata,
  addBrand,
} from 'utils/testing';

import app from 'server';
import 'db/connect';

import Article from 'api/article/article.model';

import ArticleCollection from './model';

const request = supertest.agent(app.listen());

describe('Collections API', () => {
  let sessionCookie;

  before(async () => {
    const { _id: articleBrandId } = await addBrand();

    sessionCookie = await loginTestAdmin();

    const defaultMetadata = await defaultObjectMetadata();

    // Populating DB with Collections.
    const articlePromises = [];
    for (let i = 1; i <= 5; i += 1) {
      articlePromises.push(
        new Article({
          type: 'text',
          imagePreviewUrl: 'image-url',
          brand: articleBrandId,
          metadata: defaultMetadata,
        }).save()
      );
    }
    await Promise.all(articlePromises);

    const articles = await Article.find().exec();
    const articlesList = articles.map(({ _id }) => _id);

    const promises = [];
    for (let i = 1; i <= 5; i += 1) {
      promises.push(
        new ArticleCollection({
          name: { en: `Collection ${i}` },
          description: { en: `a description` },
          slug: `collection-${i}`,
          articles: articlesList[i - 1],
        }).save()
      );
    }
    await Promise.all(promises);
  });

  after(dropData);

  describe('# Collections CRUD', () => {
    it('should return 5 collections', () =>
      request
        .get('/api/articles/collections')
        .expect(HttpStatus.OK)
        .expect(res => {
          expect(res.body).has.length(5);
        }));

    it('should return a collection', () =>
      request
        .get('/api/articles/collections/collection-2')
        .expect(HttpStatus.OK)
        .expect(res => {
          expect(res.body.slug).equals('collection-2');
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
          name: { en: 'New Collection' },
        })
        .expect(HttpStatus.OK)
        .expect(res => {
          expect(res.body.slug).equals('collection-6');
        }));

    it('should include a newly created collection', () =>
      request
        .get('/api/articles/collections')
        .expect(HttpStatus.OK)
        .expect(res => {
          expect(res.body).has.length(6);
        }));

    it('should associate regular article with the collection', () =>
      request
        .post('/api/articles/')
        .set('Cookie', sessionCookie)
        .send({
          brandSlug: 'wir',
          type: 'text',
          imagePreviewUrl: 'ololo',
          publishAt: Date.now(),
          collectionSlug: 'collection-6',
          locales: {
            be: {
              title: 'title',
              subtitle: 'subtitle',
              content: 'text',
              slug: 'slug-new1-be',
            },
          },
        })
        .expect(HttpStatus.OK)
        .expect(res => {
          expect(res.body.imagePreviewUrl).equals('ololo');
          expect(res.body.locales.be.slug).equals('slug-new1-be');
        }));

    it('should associate postponed article with the collection', () =>
      request
        .post('/api/articles/')
        .set('Cookie', sessionCookie)
        .send({
          brandSlug: 'wir',
          type: 'text',
          imagePreviewUrl: 'ololo2',
          publishAt: new Date('2025-01-01T18:25:43.511Z'),
          collectionSlug: 'collection-6',
          locales: {
            be: {
              title: 'title',
              subtitle: 'subtitle',
              content: 'text',
              slug: 'slug-new2-be',
            },
          },
        })
        .expect(HttpStatus.OK)
        .expect(res => {
          expect(res.body.imagePreviewUrl).equals('ololo2');
          expect(res.body.locales.be.slug).equals('slug-new2-be');
        }));

    it('should return both articles in the collection when querying with permissions', () =>
      request
        .get('/api/articles/collections/collection-6')
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(res => {
          expect(res.body.slug).equals('collection-6');
          expect(res.body.articles).has.length(2);
          expect(res.body.articles[0].imagePreviewUrl).equals('ololo');
          expect(res.body.articles[1].imagePreviewUrl).equals('ololo2');
        }));

    it('should return only article in the collection when querying without permissions', () =>
      request
        .get('/api/articles/collections/collection-6')
        .expect(HttpStatus.OK)
        .expect(res => {
          expect(res.body.slug).equals('collection-6');
          expect(res.body.articles).has.length(1);
          expect(res.body.articles[0].imagePreviewUrl).equals('ololo');
        }));

    it('should return collection.next when querying with permissions', () =>
      request
        .get('/api/articles/slug-new1-be')
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(res => {
          expect(res.body.locales.be.slug).equals('slug-new1-be');
          expect(res.body.collection.slug).equals('collection-6');
          expect(res.body.collection.next.locales.be.slug).equals('slug-new2-be');
        }));

    it('should not return collection.next when querying without permissions', () =>
      request
        .get('/api/articles/slug-new1-be')
        .expect(HttpStatus.OK)
        .expect(res => {
          expect(res.body.collection.next).to.be.null();
        }));

    it('should return collection.prev when querying with permissions', () =>
      request
        .get('/api/articles/slug-new2-be')
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(res => {
          expect(res.body.locales.be.slug).equals('slug-new2-be');
          expect(res.body.collection.slug).equals('collection-6');
          expect(res.body.collection.prev.locales.be.slug).equals('slug-new1-be');
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
        .expect(res => {
          expect(res.body).has.length(5);
        }));

    it('should recover a collection using update', () =>
      request
        .put('/api/articles/collections/collection-6')
        .send({ active: true, description: { en: 'desc-new' } })
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(res => {
          expect(res.body.slug).equals('collection-6');
          expect(res.body.description.en).equals('desc-new');
        }));

    it('should return a recovered collection', () =>
      request
        .get('/api/articles/collections')
        .expect(HttpStatus.OK)
        .expect(res => {
          expect(res.body).has.length(6);
          expect(res.body.map(({ slug }) => slug)).to.include('collection-6');
        }));

    it('should change the collection for the article', () =>
      request
        .put('/api/articles/slug-new2-be')
        .send({
          collectionSlug: 'collection-5',
        })
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(res => {
          expect(res.body.collection.slug).equals('collection-5');
        }));

    it('should remove an article from the old collection', () =>
      request
        .get('/api/articles/collections/collection-6')
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(res => {
          expect(res.body.slug).equals('collection-6');
          expect(res.body.articles).has.length(1);
          expect(res.body.articles[0].locales.be.slug).equals('slug-new1-be');
        }));

    it('should add an article into a new collection', () =>
      request
        .get('/api/articles/collections/collection-5')
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(res => {
          expect(res.body.slug).equals('collection-5');
          expect(res.body.articles).has.length(2);
          expect(res.body.articles[1].locales.be.slug).equals('slug-new2-be');
        }));
  });
});
