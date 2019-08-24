import HttpStatus from 'http-status-codes';

import {
  supertest,
  expect,
  dropData,
  loginTestAdmin,
  defaultObjectMetadata,
  addArticles,
  addAuthorsTag,
  addBrandsTag,
  addThemesTag,
  addTopics,
  TEST_DATA,
} from 'utils/testing';

import app from 'server';
import 'db/connect';

const request = supertest.agent(app.listen());

const validYoutubeID = TEST_DATA.youtubeId;
const validYoutubeLink = TEST_DATA.youtubeLink;
const badYoutubeLink = 'https://www.youtube.com/watch?v=BAD-ID';
const validVimeoLink = 'https://vimeo.com/197700533';
const NEW_IMAGE_URL = 'https://new-image-url.jpg';

describe('Articles API', () => {
  let dbArticles;
  let sessionCookie;

  let authorsTag;
  let brandsTag;
  let themesTag;

  let articleUnpublished;

  const numberPublished = 8;
  const numberUnpublished = 1;

  before(async () => {
    await dropData();

    sessionCookie = await loginTestAdmin();
    const metadata = await defaultObjectMetadata();
    await addTopics(metadata);

    authorsTag = await addAuthorsTag(metadata);
    brandsTag = await addBrandsTag(metadata);
    themesTag = await addThemesTag(metadata);
    dbArticles = await addArticles(numberPublished, numberUnpublished);
    articleUnpublished = dbArticles[numberPublished];
  });

  describe('# Articles CRUD', () => {
    it('should return only 8 published without authorization', () =>
      request
        .get('/api/articles')
        .expect(HttpStatus.OK)
        .expect(({ body: { data, total } }) => {
          expect(data).has.length(numberPublished);
          expect(total).to.equal(numberPublished);
          expect(data.map(({ locales }) => locales.en.slug)).not.includes('draft');
        }));

    it('should default skip to 0 and take 1 article', () =>
      request
        .get('/api/articles?take=1')
        .expect(HttpStatus.OK)
        .expect(({ body: { data, total } }) => {
          expect(data).has.length(1);
          const idx = numberPublished - 1;
          expect(data[0].locales.be.slug).to.equal(dbArticles[idx].locales.be.slug);
          expect(data[0].locales.en.slug).to.equal(dbArticles[idx].locales.en.slug);
          expect(total).to.equal(8);
        }));

    it('should properly apply skip and take 4 articles', () =>
      request
        .get('/api/articles?skip=1&take=4')
        .expect(HttpStatus.OK)
        .expect(({ body: { data, total } }) => {
          expect(data).has.length(4);
          const idx1 = numberPublished - 1 - 1;
          const idx2 = numberPublished - 1 - 4;
          expect(data[0].locales.be.slug).to.equal(dbArticles[idx1].locales.be.slug);
          expect(data[0].locales.en.slug).to.equal(dbArticles[idx1].locales.en.slug);
          expect(data[3].locales.be.slug).to.equal(dbArticles[idx2].locales.be.slug);
          expect(data[3].locales.en.slug).to.equal(dbArticles[idx2].locales.en.slug);
          expect(total).to.equal(8);
        }));

    it('should return an article by slug', () =>
      request
        .get(`/api/articles/${dbArticles[2].locales.en.slug}`)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.locales.be.slug).equal(dbArticles[2].locales.be.slug);
        }));

    it('should not return with bad slug', () =>
      request.get('/api/articles/article-not-found').expect(HttpStatus.NOT_FOUND));

    it('should not return unpublished', () =>
      request.get('/api/articles/publishAt-article-1').expect(HttpStatus.NOT_FOUND));

    it('should fail to create an article due to lack of permissions', () =>
      request.post('/api/articles').expect(HttpStatus.FORBIDDEN));

    it('should fail to update an article due to lack of permissions', () =>
      request.put('/api/articles/article-1').expect(HttpStatus.FORBIDDEN));

    it('should fail to remove an article due to lack of permissions', () =>
      request.delete('/api/articles/article-1').expect(HttpStatus.FORBIDDEN));

    it('should return 9 articles (published and unpublished)', () =>
      request
        .get('/api/articles')
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(({ body: { data, total } }) => {
          const totalNumber = numberPublished + numberUnpublished;
          expect(total).to.equal(totalNumber);
          expect(data).has.length(totalNumber);
          expect(data.map(({ locales }) => locales.be.slug)).includes(
            articleUnpublished.locales.be.slug
          );
        }));

    it('should return unpublished', () =>
      request
        .get(`/api/articles/${dbArticles[numberPublished].locales.en.slug}`)
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(({ body: { locales } }) => {
          expect(locales.en.slug).equal(articleUnpublished.locales.en.slug);
          expect(locales.be.slug).equal(articleUnpublished.locales.be.slug);
        }));

    let newArticleId;

    it('should create an article as a draft', () =>
      request
        .post('/api/articles')
        .set('Cookie', sessionCookie)
        .send({
          images: TEST_DATA.articleImages.text,
          type: 'text',
        })
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.publishAt).to.be.null();
          expect(body.createdAt).to.be.not.null();
          newArticleId = body._id;
        }));

    it('should contain a newly created article if querying with permissions', () =>
      request
        .get('/api/articles')
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(({ body: { data, total } }) => {
          expect(total).to.equal(10);
          expect(data).has.length(10);
          expect(data.map(({ _id }) => _id)).includes(newArticleId);
        }));

    it('should not contain a newly created article if querying with no permissions', () =>
      request
        .get('/api/articles')
        .expect(HttpStatus.OK)
        .expect(res => {
          expect(res.body.data).has.length(8);
          expect(res.body.data.map(({ _id }) => _id)).not.includes(newArticleId);
          expect(res.body.data.map(({ _id }) => _id)).not.includes(articleUnpublished._id);
        }));

    it('should add localization to the article', () =>
      request
        .put(`/api/articles/${newArticleId}`)
        .send({
          locales: {
            en: {
              title: 'title-new',
              subtitle: 'subtitle-new',
              slug: 'article-new',
              text: { content: 'en-text' },
            },
          },
        })
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(({ body: { locales } }) => {
          expect(locales.en.title).to.equal('title-new');
          expect(locales.en.slug).to.equal('article-new');
        }));

    let articleId;

    it('should update an article', () =>
      request
        .put('/api/articles/article-new')
        .send({
          images: {
            ...TEST_DATA.articleImages.text,
            page: NEW_IMAGE_URL,
          },
          locales: { en: {} }, // This is for server to keep the locale.
        })
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          articleId = body._id;
          expect(body.images.page).to.equal(NEW_IMAGE_URL);
          expect(body.active).to.equal(true);
          expect(body.locales.en.title).to.equal('title-new');
        }));

    it('should not get an article by ID', () =>
      request.get(`/api/articles/${articleId}`).expect(HttpStatus.NOT_FOUND));

    it('should get an article by ID with permissions', () =>
      request
        .get(`/api/articles/${articleId}`)
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.images.page).equal(NEW_IMAGE_URL);
          expect(body.locales.en.slug).to.equal('article-new');
        }));

    it('should fail to get an article due to invalid ID', () =>
      request.get(`/api/articles/${articleId}X`).expect(HttpStatus.NOT_FOUND));

    it('should remove an article by ID', () =>
      request
        .delete(`/api/articles/${articleId}`)
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK));

    it('should fail to get removed article by ID', () =>
      request.get(`/api/articles/${articleId}`).expect(HttpStatus.NOT_FOUND));

    it('should recover an article by ID', () =>
      request
        .put(`/api/articles/${articleId}`)
        .send({ active: true, locales: { en: {} } })
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.images.page).to.equal(NEW_IMAGE_URL);
          expect(body.active).to.equal(true);
        }));

    it('should get an article by slug', () =>
      request
        .get(`/api/articles/article-new`)
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.locales.en.slug).to.equal('article-new');
        }));

    it('should remove an article', () =>
      request
        .delete('/api/articles/article-new')
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK));

    it('should not contain a removed article', () =>
      request
        .get('/api/articles')
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(({ body: { data, total } }) => {
          expect(total).to.equal(9);
          expect(data).has.length(9);
        }));

    it('should not create text article due to invalid images', () =>
      request
        .post('/api/articles')
        .send({
          type: 'text',
          images: TEST_DATA.articleImages.video,
        })
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.BAD_REQUEST)
        .expect(({ body: { error } }) => {
          expect(error.images.vertical).to.contain('required');
        }));

    it('should not create video article due to invalid images', () =>
      request
        .post('/api/articles')
        .send({
          type: 'video',
          images: TEST_DATA.articleImages.text,
          videoUrl: validYoutubeLink,
        })
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.BAD_REQUEST)
        .expect(({ body: { error } }) => {
          expect(error.images.vertical).to.contain('Unknown');
        }));

    it('should create an article with brand-as-tag', () =>
      request
        .post('/api/articles')
        .send({ type: 'text', images: TEST_DATA.articleImages.text, tags: [brandsTag._id] })
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          articleId = body._id;
          expect(body.tags).to.have.length(1);
          expect(body.tags[0].slug).to.equal(brandsTag.slug);
        }));

    it('should add two tags to an article', () =>
      request
        .put(`/api/articles/${articleId}`)
        .send({
          type: 'text',
          images: TEST_DATA.articleImages.text,
          tags: [brandsTag._id, themesTag._id, authorsTag._id],
        })
        .set('Cookie', sessionCookie)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.tags).to.have.length(3);
          const tagSlugs = body.tags.map(tag => tag.slug);
          expect(tagSlugs).to.include(themesTag.slug);
          expect(tagSlugs).to.include(authorsTag.slug);
        }));
  });
});

describe('Articles Bundled API', () => {
  let sessionCookie;
  let defaultMetadata;

  const articleBase = {
    type: 'text',
    images: TEST_DATA.articleImages.text,
  };

  before(async () => {
    await dropData();

    sessionCookie = await loginTestAdmin();
    defaultMetadata = await defaultObjectMetadata();
  });

  let articleId;

  it('should fail to create a broken article due to validation failure', () =>
    request
      .post('/api/articles')
      .set('Cookie', sessionCookie)
      .send({
        images: {
          ...TEST_DATA.articleImages.text,
          horizontal: 'ololo',
        },
      })
      .expect(HttpStatus.BAD_REQUEST)
      .expect(({ body: { error } }) => {
        expect(error).not.empty();
        expect(error.type).to.include('error');
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
      .expect(HttpStatus.BAD_REQUEST)
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
            text: { content: 'some text' },
            slug: 'bad$%symbols',
          },
        },
      })
      .expect(HttpStatus.BAD_REQUEST)
      .expect(({ body: { error } }) => {
        expect(error).not.empty();
        expect(error.locales.be.slug).to.include('regex');
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
            text: { content: 'text' },
            slug: 'slug',
            locale: 'en',
          },
        },
      })
      .expect(HttpStatus.BAD_REQUEST)
      .expect(({ body: { error } }) => {
        expect(error).not.empty();
        expect(error.localeConsistency).to.include('error');
      }));

  it('should fail to create an article due to forbidden field', () =>
    request
      .post('/api/articles')
      .set('Cookie', sessionCookie)
      .send({
        ...articleBase,
        brandSlug: 'xxx',
        locales: {
          be: {
            title: 'be-title',
            subtitle: 'be-subtitle',
            text: { content: 'some-be-text' },
            slug: 'be-slug',
          },
        },
      })
      .expect(HttpStatus.BAD_REQUEST)
      .expect(({ body }) => {
        expect(body.error.brandSlug).to.contain('forbidden');
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
      .expect(HttpStatus.BAD_REQUEST)
      .expect(({ body }) => {
        expect(body.error.video).to.contain('forbiddenForTypeText');
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
      .expect(HttpStatus.BAD_REQUEST)
      .expect(({ body }) => {
        expect(body.error).to.contain('badVideoUrl');
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
      .expect(HttpStatus.BAD_REQUEST)
      .expect(({ body }) => {
        expect(body.error).to.contain('badVideoUrl');
      }));

  it('should create a video article with localizations with one API call', () =>
    request
      .post('/api/articles')
      .set('Cookie', sessionCookie)
      .send({
        collectionSlug: 'precreated-collection',
        type: 'video',
        images: TEST_DATA.articleImages.video,
        publishAt: Date.now(),
        videoUrl: validYoutubeLink,
        color: '#ababab',
        textColorTheme: 'dark',
        locales: {
          be: {
            title: 'be-title',
            subtitle: 'be-subtitle',
            text: { content: 'some-be-text' },
            slug: 'be-slug',
          },
        },
        keywords: ['keyword1', 'ключавая фраза'],
      })
      .expect(HttpStatus.OK)
      .expect(({ body: { _id, locales, images, video, color, textColorTheme, keywords } }) => {
        articleId = _id;
        expect(images.horizontal).to.equal(TEST_DATA.articleImages.video.horizontal);
        expect(images.page).to.equal(TEST_DATA.articleImages.video.page);
        expect(video.platform).to.equal('youtube');
        expect(video.videoId).to.equal(validYoutubeID);
        expect(video.videoUrl).to.equal(validYoutubeLink);
        expect(color).to.equal('#ababab');
        expect(textColorTheme).to.equal('dark');
        expect(Object.keys(locales)).has.length(1);
        expect(locales.be.slug).to.equal('be-slug');
        expect(keywords).to.have.length(2);
        expect(keywords).to.include('keyword1');
      }));

  it('should return an article by ID', () =>
    request
      .get(`/api/articles/${articleId}`)
      .expect(HttpStatus.OK)
      .expect(({ body: { images, locales } }) => {
        expect(images.page).to.equal(TEST_DATA.articleImages.video.page);
        expect(Object.keys(locales)).has.length(1);
        expect(locales.be.title).to.equal('be-title');
        expect(locales.be.slug).to.equal('be-slug');
      }));

  it('should update article video reference', () =>
    request
      .put('/api/articles/be-slug')
      .set('Cookie', sessionCookie)
      .send({
        videoUrl: validYoutubeLink,
      })
      .expect(HttpStatus.OK)
      .expect(({ body: { video } }) => {
        expect(video.platform).to.equal('youtube');
        expect(video.videoId).to.equal(validYoutubeID);
        expect(video.videoUrl).to.equal(validYoutubeLink);
      }));

  it('should update list of keywords', () =>
    request
      .put('/api/articles/be-slug')
      .set('Cookie', sessionCookie)
      .send({
        keywords: ['new-keyword'],
      })
      .expect(HttpStatus.OK)
      .expect(({ body: { keywords } }) => {
        expect(keywords).to.have.length(1);
        expect(keywords).to.include('new-keyword');
        expect(keywords).to.not.include('keyword1');
      }));

  it('should change article type to text', () =>
    request
      .put('/api/articles/be-slug')
      .set('Cookie', sessionCookie)
      .send({
        type: 'text',
        images: TEST_DATA.articleImages.text,
      })
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body.type).to.equal('text');
        expect(body.video).to.be.undefined();
        expect(body.metadata.updatedAt).to.be.above(defaultMetadata.updatedAt);
      }));

  // TODO(uladbohdan): to find a way to test duplication of slugs. The problem
  // is mongo slow in indexing unique fields which is crucial for tests.

  it('should update an article with localization', () =>
    request
      .put('/api/articles/be-slug')
      .set('Cookie', sessionCookie)
      .send({
        images: {
          ...TEST_DATA.articleImages.text,
          horizontal: NEW_IMAGE_URL,
        },
        color: '#123456',
        locales: {
          be: {
            title: 'new-be-title',
            subtitle: 'new-be-subtitle',
          },
        },
      })
      .expect(HttpStatus.OK)
      .expect(({ body: { images, locales, color } }) => {
        expect(images.horizontal).to.equal(NEW_IMAGE_URL);
        expect(Object.keys(locales)).has.length(1);
        expect(locales.be.title).to.equal('new-be-title');
        expect(locales.be.subtitle).to.equal('new-be-subtitle');
        expect(color).to.equal('#123456');
      }));

  it('should return an article with new image & title & color', () =>
    request
      .get(`/api/articles/${articleId}`)
      .expect(HttpStatus.OK)
      .expect(({ body: { images, locales, color } }) => {
        expect(images.horizontal).to.equal(NEW_IMAGE_URL);
        expect(Object.keys(locales)).has.length(1);
        expect(locales.be.title).to.equal('new-be-title');
        expect(color).to.equal('#123456');
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
            text: { content: 'some en text' },
            slug: 'en-slug',
            locale: 'en',
          },
        },
      })
      .expect(HttpStatus.OK)
      .expect(({ body: { locales } }) => {
        expect(Object.keys(locales)).has.length(2);
        expect(locales.en.title).to.equal('en-title');
        expect(locales.en.slug).to.equal('en-slug');
      }));

  it('should return the article again by ID', () =>
    request
      .get(`/api/articles/${articleId}`)
      .expect(HttpStatus.OK)
      .expect(({ body: { images, locales } }) => {
        expect(images.horizontal).to.equal(NEW_IMAGE_URL);
        expect(Object.keys(locales)).has.length(2);
        expect(locales.be.title).to.equal('new-be-title');
        expect(locales.en.title).to.equal('en-title');
      }));

  it('should remove BE locale due to absense in update request', () =>
    request
      .put('/api/articles/en-slug')
      .set('Cookie', sessionCookie)
      .send({
        locales: { en: {} },
      })
      .expect(HttpStatus.OK)
      .expect(({ body: { locales } }) => {
        expect(Object.keys(locales)).has.length(1);
        expect(locales.en.subtitle).to.equal('en-subtitle');
      }));

  it('should not find an article with removed localization', () =>
    request.get('/api/articles/be-slug').expect(HttpStatus.NOT_FOUND));

  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('should add two new locales and update existent one', () =>
    request
      .put('/api/articles/en-slug')
      .set('Cookie', sessionCookie)
      .send({
        locales: {
          be: {
            title: 'title-be',
            subtitle: 'subtitle-be',
            slug: 'slug-be2',
            text: { content: 'some-text' },
            locale: 'be',
          },
          ru: {
            title: 'title-ru',
            subtitle: 'subtitle-ru',
            slug: 'slug-ru2',
            text: { content: 'some-text' },
            locale: 'ru',
          },
          en: {
            slug: 'new-en-slug',
          },
        },
      })
      .expect(HttpStatus.OK)
      .expect(({ body: { locales, metadata } }) => {
        expect(Object.keys(locales)).has.length(3);
        expect(locales.be.slug).to.equal('slug-be2');
        expect(locales.ru.slug).to.equal('slug-ru2');
        expect(locales.en.slug).to.equal('new-en-slug');

        // FIXME: metadata populate problems
        // Below are the tests for object metadata.
        expect(metadata.updatedAt).to.be.above(defaultMetadata.updatedAt);
        expect(metadata.updatedBy).to.be.above(defaultMetadata.updatedAt);
        expect(locales.en.metadata.updatedAt).to.be.above(defaultMetadata.updatedAt);
        expect(locales.en.metadata.updatedBy.email).to.contain('@babajka');
      }));

  it('should fail to remove article type', () =>
    request
      .put('/api/articles/new-en-slug')
      .set('Cookie', sessionCookie)
      .send({ type: '' })
      .expect(HttpStatus.BAD_REQUEST)
      .expect(({ body }) => {
        expect(body.error.type).to.contain('error');
      }));

  it('should fail to remove article collection due to forbidden collection field', () =>
    request
      .put('/api/articles/new-en-slug')
      .set('Cookie', sessionCookie)
      .send({ collection: 'ololo', collectionSlug: '' })
      .expect(HttpStatus.BAD_REQUEST)
      .expect(({ body }) => {
        expect(body.error.collection).to.include('forbidden');
      }));

  // depend on previous skipped
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('should fail to remove article images', () =>
    request
      .put('/api/articles/new-en-slug')
      .set('Cookie', sessionCookie)
      .send({ images: {} })
      .expect(HttpStatus.BAD_REQUEST));

  it('should fail to remove localization title', () =>
    request
      .put('/api/articles/new-en-slug')
      .set('Cookie', sessionCookie)
      .send({ locales: { de: { title: '' } } })
      .expect(HttpStatus.BAD_REQUEST));
});
