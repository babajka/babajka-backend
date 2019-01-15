import {
  supertest,
  expect,
  dropData,
  loginTestAdmin,
  addAdminUser,
  addBrand,
  addArticles,
} from 'utils/testing';

import app from 'server';
import 'db/connect';

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
  let sessionCookie;
  let articles;
  let validMainPageState;

  before(async () => {
    sessionCookie = await loginTestAdmin();

    const { _id: articleBrandId } = await addBrand();

    articles = await addArticles(articleBrandId, 3, 2);

    validMainPageState = {
      blocks: {},
      data: { articles: articles.slice(0, 3).map(({ _id }) => _id), brands: [articleBrandId] },
    };
  });

  after(dropData);

  it('should fail to update main page state with no auth', () =>
    request
      .post('/api/storage/mainPage')
      .send(validMainPageState)
      .expect(403));

  it('should fail to push main page state with invalid entities', () =>
    request
      .post('/api/storage/mainPage')
      .set('Cookie', sessionCookie)
      .send({ blocks: {}, data: { badEntity: ['x'] } })
      .expect(400)
      .expect(({ body }) => {
        expect(body).not.empty();
        expect(body.error).not.empty();
        expect(body.error.mainPageEntities).to.contain('not valid');
      }));

  it('should succeed in pushing main page state', () =>
    request
      .post('/api/storage/mainPage')
      .set('Cookie', sessionCookie)
      .send(validMainPageState)
      .expect(200)
      .expect(({ body }) => {
        expect(body).not.empty();
        expect(body.data.articles).has.length(3);
      }));

  it('should retrieve main page state with articles populated', () =>
    request
      .get('/api/storage/mainPage')
      .set('Cookie', sessionCookie)
      .expect(200)
      .expect(({ body }) => {
        expect(body).not.empty();
        expect(body.data.articles).has.length(3);
        expect(body.data.brands).has.length(1);
      }));
});
