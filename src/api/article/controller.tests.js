import supertest from 'supertest';
import { expect } from 'chai';

import { dropData } from 'utils/testing';

import app from 'server';
import 'db/connect';
import User from 'api/user/model';
import Article from './article.model';
import ArticleBrand from './brand/model';
import LocalizedArticle from './localized/model';

const request = supertest.agent(app.listen());

describe('Articles API', () => {
  const articleIDs = [];
  const brandSlug = 'wir';

  before(async () => {
    // Populating DB with articles.
    const { _id: articleBrandId } = await new ArticleBrand({ slug: brandSlug }).save();

    let promises = [];
    for (let i = 1; i <= 8; i++) {
      const date = new Date(`2017-11-0${i}T18:25:43.511Z`);
      promises.push(
        new Article({
          brand: articleBrandId,
          type: 'text',
          createdAt: date,
          publishAt: date,
        })
          .save()
          .then(({ _id }) => {
            articleIDs[i - 1] = _id;
          })
      );
    }
    // An article with post publishing.
    promises.push(
      new Article({
        brand: articleBrandId,
        type: 'text',
        publishAt: new Date('2025-01-01T18:25:43.511Z'),
      })
        .save()
        .then(({ _id }) => {
          articleIDs[8] = _id;
        })
    );
    await Promise.all(promises);

    promises = [];
    ['en', 'be'].forEach(loc => {
      for (let i = 1; i <= 9; i++) {
        promises.push(
          new LocalizedArticle({
            locale: `${loc}`,
            title: `title-${i}-${loc}`,
            subtitle: `subtitle-${i}-${loc}`,
            slug: i === 9 ? `postpublished-slug-${loc}` : `article-${i}-${loc}`,
            articleId: articleIDs[i - 1],
          })
            .save()
            .then(async ({ _id }) => {
              const article = await Article.findOne({ _id: articleIDs[i - 1] }).exec();
              article.locales.push(_id);
              await article.save();
            })
        );
      }
    });
    await Promise.all(promises);

    const user = new User({
      firstName: 'Name',
      email: 'admin1@babajka.io',
      permissions: { canCreateArticle: true, canManageArticles: true },
    });
    await user.setPassword('password');
    await user.save();
  });

  after(dropData);

  describe('# Articles CRUD', () => {
    it('should return 4 articles from the first page', () =>
      request
        .get('/api/articles?page=0&pageSize=4')
        .expect(200)
        .expect(res => {
          expect(res.body.data).has.length(4);
          expect(res.body.data[0].locales.be.slug).to.equal('article-8-be');
          expect(res.body.data[0].locales.en.slug).to.equal('article-8-en');
          expect(res.body.data[3].locales.be.slug).to.equal('article-5-be');
          expect(res.body.data[3].locales.en.slug).to.equal('article-5-en');
        }));

    it('should return 8 published articles and skip 1 unpublished', () =>
      request
        .get('/api/articles')
        .expect(200)
        .expect(res => {
          expect(res.body.data).has.length(8);
          expect(res.body.data.map(({ locales }) => locales.en.slug)).not.includes(
            'postpublished-article-en'
          );
        }));

    it('should return an article by slug', () =>
      request
        .get('/api/articles/article-2-be')
        .expect(200)
        .expect(res => {
          expect(res.body.locales.be.slug).equal('article-2-be');
        }));

    it('should not return with bad slug', () =>
      request.get('/api/articles/article-not-found').expect(404));

    it('should not return unpublished', () =>
      request.get('/api/articles/publishAt-article-1').expect(404));

    it('should fail to create an article due to lack of permissions', () =>
      request.post('/api/articles').expect(403));

    it('should fail to update an article due to lack of permissions', () =>
      request.put('/api/articles/article-1').expect(403));

    it('should fail to remove an article due to lack of permissions', () =>
      request.delete('/api/articles/article-1').expect(403));

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
          expect(res.body.data.map(({ locales }) => locales.be.slug)).includes(
            'postpublished-slug-be'
          );
        }));

    it('should return unpublished', () =>
      request
        .get('/api/articles/postpublished-slug-en')
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          expect(res.body.locales.en.slug).equal('postpublished-slug-en');
          expect(res.body.locales.be.slug).equal('postpublished-slug-be');
        }));

    let newArticleId;

    it('should create an article', () =>
      request
        .post('/api/articles')
        .set('Cookie', sessionCookie)
        .send({
          brandSlug,
          type: 'text',
        })
        .expect(200)
        .expect(res => {
          newArticleId = res.body._id;
        }));

    it('should contain a newly created article', () =>
      request
        .get('/api/articles')
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          expect(res.body.data).has.length(10);
          expect(res.body.data.map(({ _id }) => _id)).includes(newArticleId);
        }));

    it('should create a localization and assign to the article', () =>
      request
        .post(`/api/articles/localize/${newArticleId}`)
        .send({ title: 'title-new', subtitle: 'subtitle-new', slug: 'article-new', locale: 'en' })
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          expect(res.body.title).equal('title-new');
        }));

    let articleId;

    it('should update an article', () =>
      request
        .put('/api/articles/article-new')
        .send({
          imageUrl: 'new-image-url',
        })
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          articleId = res.body._id;
          expect(res.body.imageUrl).equal('new-image-url');
          expect(res.body.active).equal(true);
        }));

    it('should get an article by ID', () =>
      request
        .get(`/api/articles/${articleId}`)
        .expect(200)
        .expect(res => {
          expect(res.body.imageUrl).equal('new-image-url');
        }));

    it('should fail to get an article due to invalid ID', () =>
      request.get(`/api/articles/${articleId}X`).expect(404));

    it('should remove an article by ID', () =>
      request
        .delete(`/api/articles/${articleId}`)
        .set('Cookie', sessionCookie)
        .expect(200));

    it('should fail to get removed article by ID', () =>
      request.get(`/api/articles/${articleId}X`).expect(404));

    it('should recover an article by ID', () =>
      request
        .put(`/api/articles/${articleId}`)
        .send({ active: true })
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          expect(res.body.imageUrl).to.equal('new-image-url');
          expect(res.body.active).to.equal(true);
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

describe('Articles Bundled API', () => {
  const brandSlug = 'wir';
  const authorEmail = 'the-best-author-ever@wir.by';

  before(async () => {
    await new ArticleBrand({ slug: brandSlug }).save();

    await new User({
      firstName: 'First',
      lastName: 'Second',
      email: authorEmail,
      role: 'author',
    }).save();

    const user = new User({
      firstName: 'Name',
      email: 'admin1@babajka.io',
      permissions: { canCreateArticle: true, canManageArticles: true },
    });
    await user.setPassword('password');
    await user.save();
  });

  after(dropData);

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

  let articleId;

  it('should create an article with localizations with one API call', () =>
    request
      .post('/api/articles')
      .set('Cookie', sessionCookie)
      .send({
        brandSlug,
        collectionSlug: 'precreated-collection',
        type: 'text',
        imageUrl: 'some-image-url',
        authorEmail,
        locales: {
          be: {
            title: 'be-title',
            subtitle: 'be-subtitle',
            text: 'some-be-text',
            slug: 'be-slug',
            locale: 'be',
          },
        },
      })
      .expect(200)
      .expect(res => {
        articleId = res.body._id;
        expect(res.body.imageUrl).to.equal('some-image-url');
        expect(Object.keys(res.body.locales)).has.length(1);
        expect(res.body.locales.be.slug).to.equal('be-slug');
      }));

  it('should return an article again by ID', () =>
    request
      .get(`/api/articles/${articleId}`)
      .expect(200)
      .expect(res => {
        expect(res.body.imageUrl).to.equal('some-image-url');
        expect(Object.keys(res.body.locales)).has.length(1);
        expect(res.body.locales.be.title).to.equal('be-title');
      }));

  // it('should update an article with localization', () =>
  //   request
  //     .put('/api/articles/be-slug')
  //     .set('Cookie', sessionCookie)
  //     .send({
  //       imageUrl: 'new-image-url',
  //       locales: {
  //         be: {
  //           title: 'new-be-title',
  //           subtitle: 'new-be-subtitle',
  //         },
  //       },
  //     })
  //     .expect(200)
  //     .expect(res => {
  //       expect(res.body.imageUrl).to.equal('new-image-url');
  //       expect(Object.keys(res.body.locales)).has.length(1);
  //       expect(res.body.locales.be.title).to.equal('new-be-title');
  //     }));

  // it('should add a localization by updating an article', () =>
  //   request
  //     .put('/api/articles/be-slug')
  //     .set('Cookie', sessionCookie)
  //     .send({
  //       locales: {
  //         en: {
  //           title: 'en-title',
  //           subtitle: 'en-subtitle',
  //           text: 'some en text',
  //           slug: 'en-slug',
  //           locale: 'en',
  //         },
  //       },
  //     })
  //     .expect(200)
  //     .expect(res => {
  //       expect(Object.keys(res.body.locales)).has.length(2);
  //       expect(res.body.locales.en.title).to.equal('en-title');
  //     }));

  // TODO(uladbohdan): to test:
  // bad author.
  // bad brand.
  // bad collection.
  // bad locale.
  // ...
});
