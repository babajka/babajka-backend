import supertest from 'supertest';
import { expect } from 'chai';

import app from 'server';
import 'db/connect';

import { dropData, loginDefaultAdmin } from 'utils/testing';

import Article from 'api/article/article.model';
import ArticleBrand from 'api/article/brand/model';

import ArticleCollection from './model';

const request = supertest.agent(app.listen());

describe('Collections API', () => {
  before(async () => {
    const brand = await new ArticleBrand({ slug: 'wir' }).save();
    // Populating DB with Collections.
    const articlePromises = [];
    for (let i = 1; i <= 5; i++) {
      articlePromises.push(
        new Article({
          type: 'text',
          imageUrl: 'image-url',
          brand: brand._id,
        }).save()
      );
    }
    await Promise.all(articlePromises);

    const articlesList = [];
    const articles = await Article.find().exec();
    articles.forEach(item => {
      articlesList.push(item._id);
    });

    const promises = [];
    for (let i = 1; i <= 5; i++) {
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

  let sessionCookie;
  before(async () => {
    sessionCookie = await loginDefaultAdmin();
  });

  after(dropData);

  describe('# Collections CRUD', () => {
    it('should return 5 collections', () =>
      request
        .get('/api/articles/collections')
        .expect(200)
        .expect(res => {
          expect(res.body).has.length(5);
        }));

    it('should return a collection', () =>
      request
        .get('/api/articles/collections/collection-2')
        .expect(200)
        .expect(res => {
          expect(res.body.slug).equals('collection-2');
        }));

    it('collection not found', () =>
      request.get('/api/articles/collections/collection-12').expect(404));

    it('should return a collection', () =>
      request
        .get('/api/articles/collections/collection-2')
        .expect(200)
        .expect(res => {
          expect(res.body.slug).equals('collection-2');
        }));

    it('should fail to create a collection due to lack of permissions', () =>
      request.post('/api/articles/collections').expect(403));

    it('should fail to update a collection due to lack of permissions', () =>
      request
        .put('/api/articles/collections/collection-1')
        .send({ description: 'a completely new description' })
        .expect(403));

    it('should fail to remove a collection due to lack of permissions', () =>
      request.delete('/api/articles/collections/collection-1').expect(403));

    it('should create a new collection', () =>
      request
        .post('/api/articles/collections')
        .set('Cookie', sessionCookie)
        .send({
          slug: 'collection-6',
          name: { en: 'New Collection' },
        })
        .expect(200)
        .expect(res => {
          expect(res.body.slug).equals('collection-6');
        }));

    it('should include a newly created collection', () =>
      request
        .get('/api/articles/collections')
        .expect(200)
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
          imageUrl: 'ololo',
          collectionSlug: 'collection-6',
          locales: {
            be: {
              title: 'title',
              subtitle: 'subtitle',
              text: 'text',
              slug: 'slug-new1-be',
            },
          },
        })
        .expect(200)
        .expect(res => {
          expect(res.body.imageUrl).equals('ololo');
          expect(res.body.locales.be.slug).equals('slug-new1-be');
        }));

    it('should associate postponed article with the collection', () =>
      request
        .post('/api/articles/')
        .set('Cookie', sessionCookie)
        .send({
          brandSlug: 'wir',
          type: 'text',
          imageUrl: 'ololo2',
          publishAt: new Date('2025-01-01T18:25:43.511Z'),
          collectionSlug: 'collection-6',
          locales: {
            be: {
              title: 'title',
              subtitle: 'subtitle',
              text: 'text',
              slug: 'slug-new2-be',
            },
          },
        })
        .expect(200)
        .expect(res => {
          expect(res.body.imageUrl).equals('ololo2');
          expect(res.body.locales.be.slug).equals('slug-new2-be');
        }));

    it('should return both articles in the collection when querying with permissions', () =>
      request
        .get('/api/articles/collections/collection-6')
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          expect(res.body.slug).equals('collection-6');
          expect(res.body.articles).has.length(2);
          expect(res.body.articles[0].imageUrl).equals('ololo');
          expect(res.body.articles[1].imageUrl).equals('ololo2');
        }));

    it('should return only article in the collection when querying without permissions', () =>
      request
        .get('/api/articles/collections/collection-6')
        .expect(200)
        .expect(res => {
          expect(res.body.slug).equals('collection-6');
          expect(res.body.articles).has.length(1);
          expect(res.body.articles[0].imageUrl).equals('ololo');
        }));

    it('should return collectionNext when querying with permissions', () =>
      request
        .get('/api/articles/slug-new1-be')
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          expect(res.body.locales.be.slug).equals('slug-new1-be');
          expect(res.body.collection.slug).equals('collection-6');
          expect(res.body.collectionNext.locales.be.slug).equals('slug-new2-be');
        }));

    it('should not return collectionNext when querying without permissions', () =>
      request
        .get('/api/articles/slug-new1-be')
        .expect(200)
        .expect(res => {
          // eslint-disable-next-line no-unused-expressions
          expect(res.body.collectionNext).to.be.null;
        }));

    it('should return collectionPrev when querying with permissions', () =>
      request
        .get('/api/articles/slug-new2-be')
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          expect(res.body.locales.be.slug).equals('slug-new2-be');
          expect(res.body.collection.slug).equals('collection-6');
          expect(res.body.collectionPrev.locales.be.slug).equals('slug-new1-be');
        }));

    it('should remove a collection', () =>
      request
        .delete('/api/articles/collections/collection-6')
        .set('Cookie', sessionCookie)
        .expect(200));

    it('should not return a removed collection', () =>
      request
        .get('/api/articles/collections')
        .expect(200)
        .expect(res => {
          expect(res.body).has.length(5);
        }));

    it('should recover a collection using update', () =>
      request
        .put('/api/articles/collections/collection-6')
        .send({ active: true, description: { en: 'desc-new' } })
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          expect(res.body.slug).equals('collection-6');
          expect(res.body.description.en).equals('desc-new');
        }));

    it('should return a recovered collection', () =>
      request
        .get('/api/articles/collections')
        .expect(200)
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
        .expect(200)
        .expect(res => {
          expect(res.body.collection.slug).equals('collection-5');
        }));

    it('should remove an article from the old collection', () =>
      request
        .get('/api/articles/collections/collection-6')
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          expect(res.body.slug).equals('collection-6');
          expect(res.body.articles).has.length(1);
          expect(res.body.articles[0].locales.be.slug).equals('slug-new1-be');
        }));

    it('should add an article into a new collection', () =>
      request
        .get('/api/articles/collections/collection-5')
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          expect(res.body.slug).equals('collection-5');
          expect(res.body.articles).has.length(2);
          expect(res.body.articles[1].locales.be.slug).equals('slug-new2-be');
        }));
  });
});
