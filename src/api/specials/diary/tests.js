import HttpStatus from 'http-status-codes';

import { supertest, expect, dropData } from 'utils/testing';

import app from 'server';
import 'db/connect';

import Diary from './model';

const request = supertest.agent(app.listen());

describe('Diary API', () => {
  before(async () => {
    await Promise.all(
      [
        {
          author: 'Author1',
          text: 'Diary01-15',
          colloquialDateHash: '0115',
          locale: 'be',
        },
        {
          author: 'Author2',
          text: 'Diary02-27',
          colloquialDateHash: '0227',
          locale: 'be',
        },
        {
          author: 'Author3',
          text: 'Diary02-28',
          colloquialDateHash: '0228',
          locale: 'be',
          year: '2018',
        },
        {
          author: 'Author4',
          text: 'Diary03-04',
          colloquialDateHash: '0304',
          locale: 'be',
        },
        {
          author: 'Author5',
          text: 'Diary05-17',
          colloquialDateHash: '0517',
          locale: 'be',
        },
      ].map(diaryData => Diary(diaryData).save())
    );
  });

  after(dropData);

  describe('# Diary CRUD', () => {
    it('should return an existing diary with prev and next', () =>
      request
        .get('/api/specials/diary/be/02/28/')
        .expect(HttpStatus.OK)
        .expect(({ body: { data, prev, next } }) => {
          expect(data.author).to.equal('Author3');
          expect(data.year).to.equal('2018');
          expect(data.month).to.equal('02');
          expect(data.day).to.equal('28');
          expect(prev.month).to.equal('02');
          expect(prev.day).to.equal('27');
          expect(next.month).to.equal('03');
          expect(next.day).to.equal('04');
        }));

    it('should return the first diary of the year', () =>
      request
        .get('/api/specials/diary/be/01/15')
        .expect(HttpStatus.OK)
        .expect(({ body: { data, prev, next } }) => {
          expect(data.author).to.equal('Author1');
          expect(data.month).to.equal('01');
          expect(data.day).to.equal('15');
          expect(prev.month).to.equal('05');
          expect(prev.day).to.equal('17');
          expect(next.month).to.equal('02');
          expect(next.day).to.equal('27');
        }));

    it('should return the last diary of the year', () =>
      request
        .get('/api/specials/diary/be/05/17')
        .expect(HttpStatus.OK)
        .expect(({ body: { data, prev, next } }) => {
          expect(data.author).to.equal('Author5');
          expect(data.month).to.equal('05');
          expect(data.day).to.equal('17');
          expect(prev.month).to.equal('03');
          expect(prev.day).to.equal('04');
          expect(next.month).to.equal('01');
          expect(next.day).to.equal('15');
        }));

    it('should return noting when request unexisting diary', () =>
      request
        .get('/api/specials/diary/be/04/15')
        .expect(HttpStatus.OK)
        .expect(({ body: { data, prev, next } }) => {
          expect(data).to.be.empty();
          expect(prev.month).to.equal('03');
          expect(prev.day).to.equal('04');
          expect(next.month).to.equal('05');
          expect(next.day).to.equal('17');
        }));
  });
});

describe('Diary API with no data', () => {
  it('should get no data', () =>
    request.get('/api/specials/diary/be/03/10').expect(HttpStatus.NO_CONTENT));
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
      .expect(HttpStatus.OK)
      .expect(({ body: { data, prev, next } }) => {
        expect(data.month).to.equal('10');
        expect(prev.month).to.equal('10');
        expect(next.month).to.equal('10');
      }));
});
