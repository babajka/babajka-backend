import {
  supertest,
  expect,
  dropData,
  loginTestAdmin,
  defaultObjectMetadata,
  addBrand,
  addAuthorUser,
  addArticles,
} from 'utils/testing';

import app from 'server';
import 'db/connect';

const request = supertest.agent(app.listen());

describe('Articles API', () => {
  let articles;
  let brandSlug;
  let sessionCookie;

  const numberPublished = 8;
  const numberUnpublished = 1;

  before(async () => {
    let articleBrandId;
    ({ _id: articleBrandId, slug: brandSlug } = await addBrand());

    sessionCookie = await loginTestAdmin();

    articles = await addArticles(articleBrandId, numberPublished, numberUnpublished);
  });

  after(dropData);

  describe('# Articles CRUD', () => {
    it('should return 4 articles from the first page', () =>
      request
        .get('/api/articles?page=0&pageSize=4')
        .expect(200)
        .expect(({ body: { data, next } }) => {
          expect(data).has.length(4);
          expect(data[0].locales.be.slug).to.equal(articles[7].be.slug);
          expect(data[0].locales.en.slug).to.equal(articles[7].en.slug);
          expect(data[3].locales.be.slug).to.equal(articles[4].be.slug);
          expect(data[3].locales.en.slug).to.equal(articles[4].en.slug);
          expect(next.page).to.equal(1);
          expect(next.pageSize).to.equal(4);
        }));

    it('should return 8 published articles and skip 1 unpublished', () =>
      request
        .get('/api/articles')
        .expect(200)
        .expect(({ body: { data, next } }) => {
          expect(data).has.length(numberPublished);
          expect(data.map(({ locales }) => locales.en.slug)).not.includes('draft');
          expect(next).to.be.false();
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

    it('should return 9 articles (published and unpublished)', () =>
      request
        .get('/api/articles')
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          expect(res.body.data).has.length(numberPublished + numberUnpublished);
          expect(res.body.data.map(({ locales }) => locales.be.slug)).includes(
            articles[numberPublished].be.slug
          );
        }));

    it('should return unpublished', () =>
      request
        .get(`/api/articles/${articles[numberPublished].en.slug}`)
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          expect(res.body.locales.en.slug).equal(articles[numberPublished].en.slug);
          expect(res.body.locales.be.slug).equal(articles[numberPublished].be.slug);
        }));

    let newArticleId;

    it('should create an article as a draft', () =>
      request
        .post('/api/articles')
        .set('Cookie', sessionCookie)
        .send({
          brandSlug,
          imagePreviewUrl: 'image-url',
          type: 'text',
        })
        .expect(200)
        .expect(res => {
          expect(res.body.publishAt).to.be.null();
          expect(res.body.createdAt).to.be.not.null();
          newArticleId = res.body._id;
        }));

    it('should contain a newly created article if querying with permissions', () =>
      request
        .get('/api/articles')
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          expect(res.body.data).has.length(10);
          expect(res.body.data.map(({ _id }) => _id)).includes(newArticleId);
        }));

    it('should not contain a newly created article if querying with no permissions', () =>
      request
        .get('/api/articles')
        .expect(200)
        .expect(res => {
          expect(res.body.data).has.length(8);
          expect(res.body.data.map(({ _id }) => _id)).not.includes(newArticleId);
          expect(res.body.data.map(({ _id }) => _id)).not.includes(articles[numberPublished]._id);
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
          imagePreviewUrl: 'new-image-url',
          locales: { en: {} }, // This is for server to keep the locale.
        })
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          articleId = res.body._id;
          expect(res.body.imagePreviewUrl).to.equal('new-image-url');
          expect(res.body.active).to.equal(true);
          expect(res.body.locales.en.title).to.equal('title-new');
        }));

    it('should not get an article by ID', () =>
      request.get(`/api/articles/${articleId}`).expect(404));

    it('should get an article by ID with permissions', () =>
      request
        .get(`/api/articles/${articleId}`)
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          expect(res.body.imagePreviewUrl).equal('new-image-url');
          expect(res.body.locales.en.slug).to.equal('article-new');
        }));

    it('should fail to get an article due to invalid ID', () =>
      request.get(`/api/articles/${articleId}X`).expect(404));

    it('should remove an article by ID', () =>
      request
        .delete(`/api/articles/${articleId}`)
        .set('Cookie', sessionCookie)
        .expect(200));

    it('should fail to get removed article by ID', () =>
      request.get(`/api/articles/${articleId}`).expect(404));

    it('should recover an article by ID', () =>
      request
        .put(`/api/articles/${articleId}`)
        .send({ active: true, locales: { en: {} } })
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          expect(res.body.imagePreviewUrl).to.equal('new-image-url');
          expect(res.body.active).to.equal(true);
        }));

    it('should get an article by slug', () =>
      request
        .get(`/api/articles/article-new`)
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(res => {
          expect(res.body.locales.en.slug).to.equal('article-new');
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
  let authorEmail;
  let brandSlug;
  let sessionCookie;
  let defaultMetadata;

  const validYoutubeID = 'ABCABCABCAB';
  const validYoutubeLink = `https://www.youtube.com/watch?v=${validYoutubeID}`;
  const badYoutubeLink = 'https://www.youtube.com/watch?v=BAD-ID';
  const validVimeoLink = 'https://vimeo.com/197700533';

  const articleBase = {
    type: 'text',
    imagePreviewUrl: 'abc',
  };

  before(async () => {
    ({ slug: brandSlug } = await addBrand());
    articleBase.brandSlug = brandSlug;

    ({ email: authorEmail } = await addAuthorUser());

    sessionCookie = await loginTestAdmin();
    defaultMetadata = await defaultObjectMetadata();
  });

  after(dropData);

  let articleId;

  it('should fail to create a broken article due to validation failure', () =>
    request
      .post('/api/articles')
      .set('Cookie', sessionCookie)
      .send({
        imagePreviewUrl: 'ololo',
      })
      .expect(400)
      .expect(res => {
        expect(res.body.error).not.empty();
        expect(res.body.error.type).to.include('error');
      }));

  it('should fail to create an article with broken localization', () =>
    request
      .post('/api/articles')
      .set('Cookie', sessionCookie)
      .send({
        ...articleBase,
        locales: {
          be: {
            title: 'xx',
            subtitle: 'yy',
          },
        },
      })
      .expect(400)
      .expect(res => {
        expect(res.body.error).not.empty();
        expect(res.body.error.locales.be.slug).to.include('error');
      }));

  it('should fail to create an article with bad locale slug', () =>
    request
      .post('/api/articles')
      .set('Cookie', sessionCookie)
      .send({
        ...articleBase,
        locales: {
          be: {
            title: 'xx',
            subtitle: 'yy',
            content: 'some text',
            slug: 'bad$%symbols',
          },
        },
      })
      .expect(400)
      .expect(res => {
        expect(res.body.error).not.empty();
        expect(res.body.error.locales.be.slug).to.include('failedMatchRegex');
      }));

  it('should fail to create an article with inconsistent locale', () =>
    request
      .post('/api/articles')
      .set('Cookie', sessionCookie)
      .send({
        ...articleBase,
        locales: {
          be: {
            title: 'xx',
            subtitle: 'yy',
            content: 'text',
            slug: 'slug',
            locale: 'en',
          },
        },
      })
      .expect(400)
      .expect(res => {
        expect(res.body.error).not.empty();
        expect(res.body.error.localeConsistency).to.include('error');
      }));

  it('should fail to create an article due to forbidden field', () =>
    request
      .post('/api/articles')
      .set('Cookie', sessionCookie)
      .send({
        ...articleBase,
        brand: 'xxx',
        locales: {
          be: {
            title: 'be-title',
            subtitle: 'be-subtitle',
            content: 'some-be-text',
            slug: 'be-slug',
          },
        },
      })
      .expect(400)
      .expect(res => {
        expect(res.body.error.brand).to.contain('forbidden');
      }));

  it('should fail to create a text article with video reference', () =>
    request
      .post('/api/articles')
      .set('Cookie', sessionCookie)
      .send({
        ...articleBase,
        type: 'text',
        videoUrl: validYoutubeLink,
      })
      .expect(400)
      .expect(res => {
        expect(res.body.error.video).to.contain('forbiddenForTypeText');
      }));

  it('should fail to create an article with unsupported video platform', () =>
    request
      .post('/api/articles')
      .set('Cookie', sessionCookie)
      .send({
        ...articleBase,
        type: 'video',
        videoUrl: validVimeoLink,
      })
      .expect(400)
      .expect(res => {
        expect(res.body.error).to.contain('badVideoUrl');
      }));

  it('should fail to create an article with bad video ID', () =>
    request
      .post('/api/articles')
      .set('Cookie', sessionCookie)
      .send({
        ...articleBase,
        type: 'video',
        videoUrl: badYoutubeLink,
      })
      .expect(400)
      .expect(res => {
        expect(res.body.error).to.contain('badVideoUrl');
      }));

  it('should create a video article with localizations with one API call', () =>
    request
      .post('/api/articles')
      .set('Cookie', sessionCookie)
      .send({
        brandSlug,
        collectionSlug: 'precreated-collection',
        type: 'video',
        imagePreviewUrl: 'some-image-url',
        authorEmail,
        publishAt: Date.now(),
        videoUrl: validYoutubeLink,
        locales: {
          be: {
            title: 'be-title',
            subtitle: 'be-subtitle',
            content: 'some-be-text',
            slug: 'be-slug',
          },
        },
      })
      .expect(200)
      .expect(res => {
        articleId = res.body._id;
        expect(res.body.imagePreviewUrl).to.equal('some-image-url');
        expect(Object.keys(res.body.locales)).has.length(1);
        expect(res.body.locales.be.slug).to.equal('be-slug');
        expect(res.body.video.platform).to.equal('youtube');
        expect(res.body.video.videoId).to.equal(validYoutubeID);
        expect(res.body.video.videoUrl).to.equal(validYoutubeLink);
      }));

  it('should return an article by ID', () =>
    request
      .get(`/api/articles/${articleId}`)
      .expect(200)
      .expect(res => {
        expect(res.body.imagePreviewUrl).to.equal('some-image-url');
        expect(Object.keys(res.body.locales)).has.length(1);
        expect(res.body.locales.be.title).to.equal('be-title');
        expect(res.body.locales.be.slug).to.equal('be-slug');
      }));

  it('should update article video reference', () =>
    request
      .put('/api/articles/be-slug')
      .set('Cookie', sessionCookie)
      .send({
        videoUrl: validYoutubeLink,
      })
      .expect(200)
      .expect(res => {
        expect(res.body.video.platform).to.equal('youtube');
        expect(res.body.video.videoId).to.equal(validYoutubeID);
        expect(res.body.video.videoUrl).to.equal(validYoutubeLink);
      }));

  it('should change article type to text', () =>
    request
      .put('/api/articles/be-slug')
      .set('Cookie', sessionCookie)
      .send({
        type: 'text',
      })
      .expect(200)
      .expect(res => {
        expect(res.body.type).to.equal('text');
        expect(res.body.video).to.be.undefined();
        expect(Date.parse(res.body.metadata.updatedAt)).to.be.above(defaultMetadata.updatedAt);
      }));

  // TODO(uladbohdan): to find a way to test duplication of slugs. The problem
  // is mongo slow in indexing unique fields which is crucial for tests.

  it('should update an article with localization', () =>
    request
      .put('/api/articles/be-slug')
      .set('Cookie', sessionCookie)
      .send({
        imagePreviewUrl: 'new-image-url',
        locales: {
          be: {
            title: 'new-be-title',
            subtitle: 'new-be-subtitle',
          },
        },
      })
      .expect(200)
      .expect(res => {
        expect(res.body.imagePreviewUrl).to.equal('new-image-url');
        expect(Object.keys(res.body.locales)).has.length(1);
        expect(res.body.locales.be.title).to.equal('new-be-title');
        expect(res.body.locales.be.subtitle).to.equal('new-be-subtitle');
      }));

  it('should return an article with new image & title', () =>
    request
      .get(`/api/articles/${articleId}`)
      .expect(200)
      .expect(res => {
        expect(res.body.imagePreviewUrl).to.equal('new-image-url');
        expect(Object.keys(res.body.locales)).has.length(1);
        expect(res.body.locales.be.title).to.equal('new-be-title');
      }));

  it('should add a localization by updating an article', () =>
    request
      .put('/api/articles/be-slug')
      .set('Cookie', sessionCookie)
      .send({
        locales: {
          be: {}, // This is enough for locale to be considered unremoved.
          en: {
            title: 'en-title',
            subtitle: 'en-subtitle',
            content: 'some en text',
            slug: 'en-slug',
            locale: 'en',
          },
        },
      })
      .expect(200)
      .expect(res => {
        expect(Object.keys(res.body.locales)).has.length(2);
        expect(res.body.locales.en.title).to.equal('en-title');
        expect(res.body.locales.en.slug).to.equal('en-slug');
      }));

  it('should return the article again by ID', () =>
    request
      .get(`/api/articles/${articleId}`)
      .expect(200)
      .expect(res => {
        expect(res.body.imagePreviewUrl).to.equal('new-image-url');
        expect(Object.keys(res.body.locales)).has.length(2);
        expect(res.body.locales.be.title).to.equal('new-be-title');
        expect(res.body.locales.en.title).to.equal('en-title');
      }));

  it('should remove BE locale due to absense in update request', () =>
    request
      .put('/api/articles/en-slug')
      .set('Cookie', sessionCookie)
      .send({
        locales: { en: {} },
      })
      .expect(200)
      .expect(res => {
        expect(Object.keys(res.body.locales)).has.length(1);
        expect(res.body.locales.en.subtitle).to.equal('en-subtitle');
      }));

  it('should not find an article with removed localization', () =>
    request.get('/api/articles/be-slug').expect(404));

  it('should add two new locales and update existent one', () =>
    request
      .put('/api/articles/en-slug')
      .set('Cookie', sessionCookie)
      .send({
        locales: {
          fr: {
            title: 'title-fr',
            subtitle: 'subtitle-fr',
            slug: 'slug-fr',
            content: 'some-text',
            locale: 'fr',
          },
          de: {
            title: 'title-de',
            subtitle: 'subtitle-de',
            slug: 'slug-de',
            content: 'some-text',
            locale: 'de',
          },
          en: {
            slug: 'new-en-slug',
          },
        },
      })
      .expect(200)
      .expect(res => {
        expect(Object.keys(res.body.locales)).has.length(3);
        expect(res.body.locales.fr.slug).to.equal('slug-fr');
        expect(res.body.locales.de.slug).to.equal('slug-de');
        expect(res.body.locales.en.slug).to.equal('new-en-slug');

        // Below are the tests for object metadata.
        expect(Date.parse(res.body.metadata.updatedAt)).to.be.above(defaultMetadata.updatedAt);
        expect(Date.parse(res.body.locales.en.metadata.updatedAt)).to.be.above(
          defaultMetadata.updatedAt
        );
        expect(res.body.locales.en.metadata.updatedBy.email).to.contain('@babajka');
      }));

  it('should fail to remove article type', () =>
    request
      .put('/api/articles/new-en-slug')
      .set('Cookie', sessionCookie)
      .send({ type: '' })
      .expect(400)
      .expect(res => {
        expect(res.body.error.type).to.contain('error');
      }));

  it('should fail to remove article brand', () =>
    request
      .put('/api/articles/new-en-slug')
      .set('Cookie', sessionCookie)
      .send({ brandSlug: '' })
      .expect(400)
      .expect(res => {
        expect(res.body.error.brandSlug).to.contain('error');
      }));

  it('should fail to remove article collection due to forbidden collection field', () =>
    request
      .put('/api/articles/new-en-slug')
      .set('Cookie', sessionCookie)
      .send({ collection: 'ololo', collectionSlug: '' })
      .expect(400)
      .expect(res => {
        expect(res.body.error.collection).to.include('forbidden');
      }));

  it('should fail to remove article imagePreviewUrl', () =>
    request
      .put('/api/articles/new-en-slug')
      .set('Cookie', sessionCookie)
      .send({ imagePreviewUrl: '' })
      .expect(400));

  it('should fail to remove localization title', () =>
    request
      .put('/api/articles/new-en-slug')
      .set('Cookie', sessionCookie)
      .send({ locales: { de: { title: '' } } })
      .expect(400));
});
