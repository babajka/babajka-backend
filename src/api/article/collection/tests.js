import supertest from 'supertest';
import { expect } from 'chai';

import app from 'server';
import 'db/connect';

import Article from 'api/article/article.model';
import ArticleBrand from 'api/article/brand/model';
import User from 'api/user/model';

import ArticleCollection from './model';

const request = supertest.agent(app.listen());

describe('Collections API', () => {
  before(async () => {
    const brand = await new ArticleBrand({ name: 'Wir' }).save();
    // Populating DB with Collections.
    const articlePromises = [];
    for (let i = 1; i <= 5; i++) {
      articlePromises.push(
        new Article({
          slug: `article-${i}`,
          title: 'title',
          subtitle: 'subtitle',
          type: 'text',
          // eslint-disable-next-line no-underscore-dangle
          brand: brand._id,
        }).save()
      );
    }
    await Promise.all(articlePromises);

    const articlesDict = {};
    const articles = await Article.find().exec();
    await articles.forEach(item => {
      // eslint-disable-next-line no-underscore-dangle
      articlesDict[item.slug] = item._id;
    });

    const promises = [];
    for (let i = 1; i <= 5; i++) {
      promises.push(
        new ArticleCollection({
          name: `Collection ${i}`,
          description: `a description`,
          slug: `collection-${i}`,
          articles: articlesDict[`article-${i}`],
        }).save()
      );
    }
    await Promise.all(promises);

    const user = new User({
      email: 'test2@babajka.io',
      permissions: { canManageUsers: true },
    });
    await user.setPassword('password');
    await user.save();
  });

  after(async () => {
    const promises = [];
    for (let i = 1; i <= 5; i++) {
      promises.push(ArticleCollection.remove({ slug: `collection-${i}` }));
    }
    for (let i = 1; i <= 5; i++) {
      promises.push(Article.remove({ slug: `article-${i}` }));
    }
    promises.push(ArticleBrand.remove({ name: 'Wir' }));
    promises.push(User.remove({ email: 'test2@babajka.io' }));
    await Promise.all(promises);
  });

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
          expect(res.body.slug, 'collection-2');
        }));

    it('collection not found', () =>
      request.get('/api/articles/collections/collection-12').expect(404));

    it('should return a collection', () =>
      request
        .get('/api/articles/collections/collection-2')
        .expect(200)
        .expect(res => {
          expect(res.body.slug, 'collection-2');
        }));

    it('should fail to create a collection due to lack of permissions', () =>
      request.post('/api/articles/collections').expect(401));

    it('should fail to update a collection due to lack of permissions', () =>
      request
        .put('/api/articles/collections/collection-1')
        .send({ description: 'a completely new description' })
        .expect(401));

    it('should fail to remove a collection due to lack of permissions', () =>
      request.delete('/api/articles/collections/collection-1').expect(401));

    let sessionCookie;

    request
      .post('/auth/login')
      .send({ email: 'test2@babajka.io', password: 'password' })
      .expect(200)
      .then(res => {
        // eslint-disable-next-line no-unused-expressions
        expect(res.headers['set-cookie']).not.empty;
        [sessionCookie] = res.headers['set-cookie'];
        expect(res.body.email).equal('test1@babajka.io');
      });

    it('should create a new collection', () => {
      request
        .post('/api/articles/collections')
        .set('Cookie', sessionCookie)
        .send({
          slug: 'collection-6',
          name: 'New Collection',
        })
        .expect(200)
        .expect(res => {
          expect(res.body.slug, 'collection-6');
        });

      request
        .get('/api/articles/collections')
        .expect(200)
        .expect(res => {
          expect(res.body).has.length(6);
        });
    });

    it('should remove a collection', () => {
      request
        .delete('/api/articles/collections/collection-6')
        .set('Cookie', sessionCookie)
        .expect(200);

      request
        .get('/api/articles/collections')
        .expect(200)
        .expect(res => {
          expect(res.body).has.length(5);
        });
    });

    it('should recover a collection using update', () => {
      request
        .put('/api/articles/collections/collection-6')
        .send({ active: true, description: 'desc-new' })
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          expect(res.slug, 'collection-6');
          expect(res.description, 'desc-new');
        });

      request
        .get('/api/articles/collections')
        .expect(200)
        .expect(res => {
          expect(res.body).has.length(6);
        });
    });
  });
});
