import {
  supertest,
  expect,
  dropData,
  loginTestAdmin,
  defaultObjectMetadata,
  addArticles,
  addBrandsTag,
  addThemesTag,
  addTopics,
  TEST_DATA,
} from 'utils/testing';

import app from 'server';
import 'db/connect';

const request = supertest.agent(app.listen());

const validYoutubeID = 'ABCABCABCAB';
const validYoutubeLink = `https://www.youtube.com/watch?v=${validYoutubeID}`;
const badYoutubeLink = 'https://www.youtube.com/watch?v=BAD-ID';
const validVimeoLink = 'https://vimeo.com/197700533';

describe('Articles API', () => {
  let dbArticles;
  let sessionCookie;

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

    brandsTag = await addBrandsTag(metadata);
    themesTag = await addThemesTag(metadata);

    dbArticles = await addArticles(numberPublished, numberUnpublished);

    articleUnpublished = dbArticles[numberPublished];
  });

  describe('# Articles CRUD', () => {
    it('should return only 8 published without authorization', () =>
      request
        .get('/api/articles')
        .expect(200)
        .expect(({ body: { data, total } }) => {
          expect(data).has.length(numberPublished);
          expect(total).to.equal(numberPublished);
          expect(data.map(({ locales }) => locales.en.slug)).not.includes('draft');
        }));

    it('should default skip to 0 and take 1 article', () =>
      request
        .get('/api/articles?take=1')
        .expect(200)
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
        .expect(200)
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
        .expect(200)
        .expect(({ body }) => {
          expect(body.locales.be.slug).equal(dbArticles[2].locales.be.slug);
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
        .expect(200)
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
        .expect(200)
        .expect(({ body }) => {
          expect(body.publishAt).to.be.null();
          expect(body.createdAt).to.be.not.null();
          newArticleId = body._id;
        }));

    it('should contain a newly created article if querying with permissions', () =>
      request
        .get('/api/articles')
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(({ body: { data, total } }) => {
          expect(total).to.equal(10);
          expect(data).has.length(10);
          expect(data.map(({ _id }) => _id)).includes(newArticleId);
        }));

    it('should not contain a newly created article if querying with no permissions', () =>
      request
        .get('/api/articles')
        .expect(200)
        .expect(res => {
          expect(res.body.data).has.length(8);
          expect(res.body.data.map(({ _id }) => _id)).not.includes(newArticleId);
          expect(res.body.data.map(({ _id }) => _id)).not.includes(articleUnpublished._id);
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
          images: {
            ...TEST_DATA.articleImages.text,
            page: 'new-image-url',
          },
          locales: { en: {} }, // This is for server to keep the locale.
        })
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(({ body }) => {
          articleId = body._id;
          expect(body.images.page).to.equal('new-image-url');
          expect(body.active).to.equal(true);
          expect(body.locales.en.title).to.equal('title-new');
        }));

    it('should not get an article by ID', () =>
      request.get(`/api/articles/${articleId}`).expect(404));

    it('should get an article by ID with permissions', () =>
      request
        .get(`/api/articles/${articleId}`)
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(({ body }) => {
          expect(body.images.page).equal('new-image-url');
          expect(body.locales.en.slug).to.equal('article-new');
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
        .expect(({ body }) => {
          expect(body.images.page).to.equal('new-image-url');
          expect(body.active).to.equal(true);
        }));

    it('should get an article by slug', () =>
      request
        .get(`/api/articles/article-new`)
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(({ body }) => {
          expect(body.locales.en.slug).to.equal('article-new');
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
        .expect(400)
        .expect(({ body: { error } }) => {
          expect(error.errors.images.vertical).to.contain('required');
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
        .expect(400)
        .expect(({ body: { error } }) => {
          expect(error.errors.images.vertical).to.contain('Unknown');
        }));

    it('should create an article with brand-as-tag', () =>
      request
        .post('/api/articles')
        .send({ type: 'text', images: TEST_DATA.articleImages.text, tags: [brandsTag._id] })
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(({ body }) => {
          articleId = body._id;
          expect(body.tags).to.have.length(1);
          expect(body.tags[0].slug).to.equal(brandsTag.slug);
        }));

    it('should add a tag to an article', () =>
      request
        .put(`/api/articles/${articleId}`)
        .send({
          type: 'text',
          images: TEST_DATA.articleImages.text,
          tags: [brandsTag._id, themesTag._id],
        })
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect(({ body }) => {
          expect(body.tags).to.have.length(2);
          const tagSlugs = body.tags.map(tag => tag.slug);
          expect(tagSlugs).to.include(themesTag.slug);
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
        brandSlug: 'xxx',
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
        collectionSlug: 'precreated-collection',
        type: 'video',
        images: TEST_DATA.articleImages.video,
        publishAt: Date.now(),
        videoUrl: validYoutubeLink,
        color: 'ababab',
        textColorTheme: 'dark',
        locales: {
          be: {
            title: 'be-title',
            subtitle: 'be-subtitle',
            content: 'some-be-text',
            slug: 'be-slug',
            keywords: ['keyword1', 'ключавая фраза'],
          },
        },
      })
      .expect(200)
      .expect(({ body: { _id, locales, images, video, color, textColorTheme } }) => {
        articleId = _id;
        expect(images.horizontal).to.equal(TEST_DATA.articleImages.video.horizontal);
        expect(images.page).to.equal(TEST_DATA.articleImages.video.page);
        expect(video.platform).to.equal('youtube');
        expect(video.videoId).to.equal(validYoutubeID);
        expect(video.videoUrl).to.equal(validYoutubeLink);
        expect(color).to.equal('ababab');
        expect(textColorTheme).to.equal('dark');
        expect(Object.keys(locales)).has.length(1);
        expect(locales.be.slug).to.equal('be-slug');
        expect(locales.be.keywords).to.have.length(2);
        expect(locales.be.keywords).to.include('keyword1');
      }));

  it('should return an article by ID', () =>
    request
      .get(`/api/articles/${articleId}`)
      .expect(200)
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
      .expect(200)
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
        locales: {
          be: {
            keywords: ['new-keyword'],
          },
        },
      })
      .expect(200)
      .expect(({ body: { locales: { be: { keywords } } } }) => {
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
      .expect(200)
      .expect(({ body }) => {
        expect(body.type).to.equal('text');
        expect(body.video).to.be.undefined();
        expect(Date.parse(body.metadata.updatedAt)).to.be.above(defaultMetadata.updatedAt);
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
          horizontal: 'new-image-url',
        },
        color: '123456',
        locales: {
          be: {
            title: 'new-be-title',
            subtitle: 'new-be-subtitle',
          },
        },
      })
      .expect(200)
      .expect(({ body: { images, locales, color } }) => {
        expect(images.horizontal).to.equal('new-image-url');
        expect(Object.keys(locales)).has.length(1);
        expect(locales.be.title).to.equal('new-be-title');
        expect(locales.be.subtitle).to.equal('new-be-subtitle');
        expect(color).to.equal('123456');
      }));

  it('should return an article with new image & title & color', () =>
    request
      .get(`/api/articles/${articleId}`)
      .expect(200)
      .expect(({ body: { images, locales, color } }) => {
        expect(images.horizontal).to.equal('new-image-url');
        expect(Object.keys(locales)).has.length(1);
        expect(locales.be.title).to.equal('new-be-title');
        expect(color).to.equal('123456');
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
      .expect(({ body: { locales } }) => {
        expect(Object.keys(locales)).has.length(2);
        expect(locales.en.title).to.equal('en-title');
        expect(locales.en.slug).to.equal('en-slug');
      }));

  it('should return the article again by ID', () =>
    request
      .get(`/api/articles/${articleId}`)
      .expect(200)
      .expect(({ body: { images, locales } }) => {
        expect(images.horizontal).to.equal('new-image-url');
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
      .expect(200)
      .expect(({ body: { locales } }) => {
        expect(Object.keys(locales)).has.length(1);
        expect(locales.en.subtitle).to.equal('en-subtitle');
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
      .expect(({ body: { locales, metadata } }) => {
        expect(Object.keys(locales)).has.length(3);
        expect(locales.fr.slug).to.equal('slug-fr');
        expect(locales.de.slug).to.equal('slug-de');
        expect(locales.en.slug).to.equal('new-en-slug');

        // Below are the tests for object metadata.
        expect(Date.parse(metadata.updatedAt)).to.be.above(defaultMetadata.updatedAt);
        expect(Date.parse(locales.en.metadata.updatedAt)).to.be.above(defaultMetadata.updatedAt);
        expect(locales.en.metadata.updatedBy.email).to.contain('@babajka');
      }));

  it('should fail to remove article type', () =>
    request
      .put('/api/articles/new-en-slug')
      .set('Cookie', sessionCookie)
      .send({ type: '' })
      .expect(400)
      .expect(({ body }) => {
        expect(body.error.type).to.contain('error');
      }));

  it('should fail to remove article collection due to forbidden collection field', () =>
    request
      .put('/api/articles/new-en-slug')
      .set('Cookie', sessionCookie)
      .send({ collection: 'ololo', collectionSlug: '' })
      .expect(400)
      .expect(({ body }) => {
        expect(body.error.collection).to.include('forbidden');
      }));

  it('should fail to remove article images', () =>
    request
      .put('/api/articles/new-en-slug')
      .set('Cookie', sessionCookie)
      .send({ images: {} })
      .expect(400));

  it('should fail to remove localization title', () =>
    request
      .put('/api/articles/new-en-slug')
      .set('Cookie', sessionCookie)
      .send({ locales: { de: { title: '' } } })
      .expect(400));
});
