import HttpStatus from 'http-status-codes';

import {
  supertest,
  expect,
  dropData,
  loginTestAdmin,
  addArticles,
  addThemesTag,
  addTopics,
  defaultObjectMetadata,
} from 'utils/testing';
import { mapIds } from 'utils/getters';

import app from 'server';
import 'db/connect';

import { TOPIC_SLUGS } from 'constants/topic';

const request = supertest.agent(app.listen());

describe('Storage API', () => {
  let dbArticleIds;
  let sessionCookie;
  let validMainPageState;
  let validSidebarState;

  before(async () => {
    await dropData();

    sessionCookie = await loginTestAdmin();
    const metadata = await defaultObjectMetadata();

    const rawArticles = await addArticles(3, 2);
    dbArticleIds = mapIds(rawArticles.slice(0, 3));

    await addTopics(metadata);

    const tag = await addThemesTag(metadata);
    const tagId = tag._id;

    validMainPageState = {
      blocks: [{ type: 'featured' }, { type: 'diary' }],
      data: { articles: dbArticleIds, tags: [tagId] },
    };

    validSidebarState = {
      blocks: [{ type: 'themes', tags: [1, 2, 3] }],
      data: { tags: [tagId] },
    };
  });

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
      .expect(({ body: { blocks, data: { articles, tags } } }) => {
        expect(blocks).to.deep.equal(validMainPageState.blocks);
        expect(articles).has.length(3);
        expect(tags).has.length(1);
      }));

  it('should retrieve main page state with articles populated', () =>
    request
      .get('/api/storage/main-page')
      .set('Cookie', sessionCookie)
      .expect(HttpStatus.OK)
      .expect(({ body: { blocks, data: { articles, topics, latestArticles } } }) => {
        expect(blocks).to.deep.equal(validMainPageState.blocks);

        expect(articles).has.length(3);
        expect(articles.map(({ _id }) => _id)).to.have.members(dbArticleIds);

        expect(topics).have.length(TOPIC_SLUGS.length);

        expect(latestArticles).have.length(3);
      }));

  it('should succeed in pushing sidebar state', () =>
    request
      .post('/api/storage/sidebar')
      .set('Cookie', sessionCookie)
      .send(validSidebarState)
      .expect(HttpStatus.OK)
      .expect(({ body: { blocks, data: { tags } } }) => {
        expect(blocks).to.deep.equal(validSidebarState.blocks);
        expect(tags).has.length(1);
      }));

  it('should retrieve sidebar state with tags and topics', () =>
    request
      .get('/api/storage/sidebar')
      .expect(HttpStatus.OK)
      .expect(({ body: { blocks, data: { tags } } }) => {
        expect(blocks).to.deep.equal(validSidebarState.blocks);
        expect(tags).have.length(1);
      }));
});
