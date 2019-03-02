import HttpStatus from 'http-status-codes';

import {
  supertest,
  expect,
  dropData,
  loginTestAdmin,
  addAdminUser,
  addBrand,
  addArticles,
  addTag,
  addTopics,
  defaultObjectMetadata,
} from 'utils/testing';

import app from 'server';
import 'db/connect';

import { TOPIC_SLUGS } from 'constants/topic';
import { StorageEntity } from './model';

const request = supertest.agent(app.listen());

describe('Storage Helpers', () => {
  let userId;

  before(async () => {
    const user = await addAdminUser();
    userId = user._id;
    await StorageEntity.setValue('key', { some: 'value' }, userId);
  });

  after(dropData);

  it('should retrieve a value from the storage', () =>
    StorageEntity.getValue('key').then(({ document }) => {
      expect(document).not.empty();
      expect(document.some).to.equal('value');
    }));

  it('should update storage entity on set', () =>
    StorageEntity.setValue('key', { some: 'old', also: 'new' }, userId).then(({ document }) => {
      expect(document).not.empty();
      expect(document.some).to.equal('old');
      expect(document.also).to.equal('new');
    }));

  it('should retrieve an updates value from storage', () =>
    StorageEntity.getValue('key').then(({ document }) => {
      expect(document).not.empty();
      expect(document.also).to.equal('new');
    }));
});

describe('Storage API', () => {
  let articleBrandId;
  let dbArticleIds;
  let sessionCookie;
  let validMainPageState;

  before(async () => {
    sessionCookie = await loginTestAdmin();
    const metadata = await defaultObjectMetadata();

    const brand = await addBrand();
    articleBrandId = brand._id;

    const rawArticles = await addArticles(articleBrandId, 3, 2);
    dbArticleIds = rawArticles.slice(0, 3).map(({ _id }) => _id.toString());

    await addTopics(metadata);

    const tag = await addTag(metadata);
    const tagId = tag._id;

    validMainPageState = {
      blocks: [{ type: 'featured' }, { type: 'diary' }],
      data: { articles: dbArticleIds, brands: [articleBrandId], tags: [tagId] },
    };
  });

  after(dropData);

  it('should fail to update main page state with no auth', () =>
    request
      .post('/api/storage/main-page')
      .send(validMainPageState)
      .expect(HttpStatus.FORBIDDEN));

  it('should fail to push main page state with invalid entities', () =>
    request
      .post('/api/storage/main-page')
      .set('Cookie', sessionCookie)
      .send({ blocks: [], data: { badEntity: ['x'] } })
      .expect(HttpStatus.BAD_REQUEST)
      .expect(({ body }) => {
        expect(body).not.empty();
        expect(body.error).not.empty();
        expect(body.error.mainPageEntities).to.contain('not valid');
      }));

  it('should not found main page state as it was never initialized', () =>
    request.get('/api/storage/main-page').expect(HttpStatus.NOT_FOUND));

  it('should succeed in pushing main page state', () =>
    request
      .post('/api/storage/main-page')
      .set('Cookie', sessionCookie)
      .send(validMainPageState)
      .expect(HttpStatus.OK)
      .expect(({ body: { blocks, data: { articles, brands, tags } } }) => {
        expect(blocks).to.deep.equal(validMainPageState.blocks);
        expect(articles).has.length(3);
        expect(brands).has.length(1);
        expect(tags).has.length(1);
      }));

  it('should retrieve main page state with articles populated', () =>
    request
      .get('/api/storage/main-page')
      .set('Cookie', sessionCookie)
      .expect(HttpStatus.OK)
      .expect(({ body: { blocks, data: { articles, brands, topics, latestArticles } } }) => {
        expect(blocks).to.deep.equal(validMainPageState.blocks);

        expect(articles).has.length(3);
        expect(articles.map(({ _id }) => _id)).to.have.members(dbArticleIds);

        expect(brands).has.length(1);
        expect(brands[0]._id).to.equal(articleBrandId.toString());

        expect(topics).have.length(TOPIC_SLUGS.length);

        expect(latestArticles).have.length(3);
      }));
});
