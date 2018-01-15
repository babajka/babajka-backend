import supertest from 'supertest';
import { expect } from 'chai';

import app from 'server';
import 'db/connect';
import User from 'api/user/model';
import Article from './article.model';
import ArticleBrand from './brand/model';
import LocalizedArticle from './localized/model';

const request = supertest.agent(app.listen());

describe('Articles API', () => {
  let articleBrandId;
  const articleIDs = [];

  before(async () => {
    // TODO(uladbohdan): to fix.
    await Article.remove();
    // Populating DB with articles.
    const articleBrand = await new ArticleBrand({ name: 'Wir' }).save();
    articleBrandId = articleBrand._id;
    let promises = [];
    for (let i = 1; i <= 8; i++) {
      const date = new Date(`2017-11-0${i}T18:25:43.511Z`);
      promises.push(
        new Article({
          brand: articleBrand._id,
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
        brand: articleBrand._id,
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
      email: 'admin1@babajka.io',
      permissions: { canCreateArticle: true, canManageArticles: true },
    });
    await user.setPassword('password');
    await user.save();
  });

  after(async () => {
    const promises = [];
    promises.push(Article.remove());
    promises.push(LocalizedArticle.remove());
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
          brand: articleBrandId,
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

    it('should update an article', () =>
      request
        .put('/api/articles/article-new')
        .send({
          // TODO(uladbohdan): to replace with a better example of an update.
          active: true,
        })
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          expect(res.body.active).equal(true);
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
