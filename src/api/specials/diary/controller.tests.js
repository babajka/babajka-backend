import 'db/connect';
import HttpStatus from 'http-status-codes';

import app from 'server';
import {
  supertest,
  expect,
  dropData,
  addPersonalityTag,
  defaultObjectMetadata,
  addTopics,
  addAdminUser,
} from 'utils/testing';
import { getId } from 'utils/getters';

import Diary from './model';

const request = supertest.agent(app.listen());

describe('Diary API', () => {
  let author1;
  let author2;

  before(async () => {
    await dropData();

    await addAdminUser();
    const metadata = await defaultObjectMetadata();
    await addTopics(metadata);
    author1 = await addPersonalityTag(metadata);
    author2 = await addPersonalityTag(metadata, 'kolas');

    await Promise.all(
      [
        {
          author: getId(author1),
          text: { content: 'Diary01-15' },
          colloquialDateHash: '0115',
          locale: 'be',
        },
        {
          author: getId(author2),
          text: { content: 'Diary02-27' },
          colloquialDateHash: '0227',
          locale: 'be',
        },
        {
          author: getId(author2),
          text: { content: 'Diary02-28' },
          colloquialDateHash: '0228',
          locale: 'be',
          year: '2018',
        },
        {
          author: getId(author1),
          text: { content: 'Diary03-04' },
          colloquialDateHash: '0304',
          locale: 'be',
        },
        {
          author: getId(author1),
          text: { content: 'Diary05-17' },
          colloquialDateHash: '0517',
          locale: 'be',
        },
      ].map((diaryData, i) =>
        Diary({
          ...diaryData,
          fiberyId: `abcde-long-slug-${i}`,
          fiberyPublicId: i,
        }).save()
      )
    );
  });

  const expectDiaryFeb28 = ({
    body: {
      data: { author, year, month, day, slug },
      prev,
      next,
    },
  }) => {
    expect(author.slug).to.equal(author2.slug);
    expect(year).to.equal(2018);
    expect(month).to.equal('02');
    expect(day).to.equal('28');
    expect(slug).to.equal('abc2');

    expect(prev.month).to.equal('02');
    expect(prev.day).to.equal('27');
    expect(prev.slug).to.equal('abc1');

    expect(next.month).to.equal('03');
    expect(next.day).to.equal('04');
    expect(next.slug).to.equal('abc3');
  };

  describe('# Diary CRUD', () => {
    it('should return an existing diary with prev and next', () =>
      request
        .get('/api/specials/diary/get/02/28/')
        .expect(HttpStatus.OK)
        .expect(expectDiaryFeb28));

    it('should return an existing diary by short slug', () =>
      request
        .get('/api/specials/diary/getBySlug/abc2/')
        .expect(HttpStatus.OK)
        .expect(expectDiaryFeb28));

    it('should return an existing diary by long slug (backward-compatibility)', () =>
      request
        .get('/api/specials/diary/getBySlug/abcde-long-slug-2/')
        .expect(HttpStatus.OK)
        .expect(expectDiaryFeb28));

    it('should return 404 by unknown slug', () =>
      request.get('/api/specials/diary/getBySlug/diary-bad-slug/').expect(HttpStatus.NOT_FOUND));

    it('should return 404 by slug with broken secret part', () =>
      request.get('/api/specials/diary/getBySlug/xyz2/').expect(HttpStatus.NOT_FOUND));

    it('should return the first diary of the year', () =>
      request
        .get('/api/specials/diary/get/01/15')
        .expect(HttpStatus.OK)
        .expect(({ body: { data, prev, next } }) => {
          expect(data.author.slug).to.equal(author1.slug);
          expect(data.month).to.equal('01');
          expect(data.day).to.equal('15');
          expect(data.slug).to.equal('abc0');

          expect(prev.month).to.equal('05');
          expect(prev.day).to.equal('17');
          expect(prev.slug).to.equal('abc4');

          expect(next.month).to.equal('02');
          expect(next.day).to.equal('27');
          expect(next.slug).to.equal('abc1');
        }));

    it('should return the last diary of the year', () =>
      request
        .get('/api/specials/diary/get/05/17')
        .expect(HttpStatus.OK)
        .expect(({ body: { data, prev, next } }) => {
          expect(data.author.slug).to.equal(author1.slug);
          expect(data.month).to.equal('05');
          expect(data.day).to.equal('17');
          expect(data.slug).to.equal('abc4');

          expect(prev.month).to.equal('03');
          expect(prev.day).to.equal('04');
          expect(prev.slug).to.equal('abc3');

          expect(next.month).to.equal('01');
          expect(next.day).to.equal('15');
          expect(next.slug).to.equal('abc0');
        }));

    it('should return closest previous when request unexisting diary', () =>
      request
        .get('/api/specials/diary/get/04/15')
        .expect(HttpStatus.OK)
        .expect(({ body: { data, prev, next } }) => {
          expect(data.author.slug).to.equal(author1.slug);
          expect(data.month).to.equal('03');
          expect(data.day).to.equal('04');
          expect(data.slug).to.equal('abc3');

          expect(prev.month).to.equal('02');
          expect(prev.day).to.equal('28');
          expect(prev.slug).to.equal('abc2');

          expect(next.month).to.equal('05');
          expect(next.day).to.equal('17');
          expect(next.slug).to.equal('abc4');
        }));
  });
});

describe('Diary API with no data', () => {
  before(dropData);

  it('should get no data', () =>
    request.get('/api/specials/diary/get/03/10').expect(HttpStatus.NO_CONTENT));
});

describe('Diary API with lack of data', () => {
  before(async () => {
    await dropData();

    await addAdminUser();
    const metadata = await defaultObjectMetadata();
    await addTopics(metadata);
    const author = await addPersonalityTag(metadata);

    await Diary({
      author: getId(author),
      fiberyId: 'diary1',
      fiberyPublicId: '1',
      text: { content: 'Diary10-27' },
      colloquialDateHash: 1027,
      locale: 'be',
    }).save();
  });

  it('should return one diary three times', () =>
    request
      .get('/api/specials/diary/get/10/27')
      .expect(HttpStatus.OK)
      .expect(({ body: { data, prev, next } }) => {
        expect(data.month).to.equal('10');
        expect(prev.month).to.equal('10');
        expect(next.month).to.equal('10');
      }));
});
