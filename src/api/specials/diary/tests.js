import { supertest, expect, dropData } from 'utils/testing';

import app from 'server';
import 'db/connect';

import Diary from './model';

const request = supertest.agent(app.listen());

describe('Diary API', () => {
  before(async () => {
    await Promise.all([
      Diary({
        author: 'Author1',
        text: 'Diary02-27',
        colloquialDateHash: '0227',
        locale: 'be',
      }).save(),
      Diary({
        author: 'Author2',
        text: 'Diary02-28',
        colloquialDateHash: '0228',
        locale: 'be',
        year: '2018',
      }).save(),
      Diary({
        author: 'Author3',
        text: 'Diary03-01',
        colloquialDateHash: '0301',
        locale: 'be',
      }).save(),
    ]);
  });

  after(dropData);

  describe('# Diary CRUD', () => {
    it('should return an existing diary with prev and next', () =>
      request
        .get('/api/specials/diary/be/02/28/')
        .expect(200)
        .expect(({ body: { data, prev, next } }) => {
          expect(data.author).to.equal('Author2');
          expect(data.year).to.equal('2018');
          expect(data.month).to.equal('02');
          expect(data.day).to.equal('28');
          expect(prev.month).to.equal('02');
          expect(prev.day).to.equal('27');
          expect(next.month).to.equal('03');
          expect(next.day).to.equal('01');
        }));

    it('should return the first diary of the year', () =>
      request
        .get('/api/specials/diary/be/02/27')
        .expect(200)
        .expect(({ body: { data, prev, next } }) => {
          expect(data.author).to.equal('Author1');
          expect(prev.month).to.equal('03');
          expect(prev.day).to.equal('01');
          expect(next.month).to.equal('02');
          expect(next.day).to.equal('28');
        }));

    it('should return the last diary of the year', () =>
      request
        .get('/api/specials/diary/be/03/01')
        .expect(200)
        .expect(({ body: { data, prev, next } }) => {
          expect(data.author).to.equal('Author3');
          expect(prev.month).to.equal('02');
          expect(prev.day).to.equal('28');
          expect(next.month).to.equal('02');
          expect(next.day).to.equal('27');
        }));

    it('should return noting when request unexisting diary', () =>
      request
        .get('/api/specials/diary/be/01/15')
        .expect(200)
        .expect(({ body: { data, prev, next } }) => {
          expect(data).to.be.empty();
          expect(prev.month).to.equal('03');
          expect(next.month).to.equal('02');
        }));
  });
});

describe('Diary API with no data', () => {
  it('should get no data', () => request.get('/api/specials/diary/be/03/10').expect(204));
});

describe('Diary API with lack of data', () => {
  before(async () => {
    await Diary({
      author: 'Author1',
      text: 'Diary10-27',
      colloquialDateHash: '1027',
      locale: 'be',
    }).save();
  });

  after(dropData);

  it('should return one diary three times', () =>
    request
      .get('/api/specials/diary/be/10/27')
      .expect(200)
      .expect(({ body: { data, prev, next } }) => {
        expect(data.month).to.equal('10');
        expect(prev.month).to.equal('10');
        expect(next.month).to.equal('10');
      }));
});
