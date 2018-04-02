import supertest from 'supertest';
import { expect } from 'chai';

import app from 'server';
import 'db/connect';

import { dropData } from 'utils/testing';

import Diary from './model';

const request = supertest.agent(app.listen());

describe('Diary API', () => {
  before(async () => {
    await Promise.all([
      Diary({
        author: 'Author1',
        text: 'Diary02-27',
        colloquialDate: '02-27',
        locale: 'be',
      }).save(),
      Diary({
        author: 'Author2',
        text: 'Diary02-28',
        colloquialDate: '02-28',
        locale: 'be',
        year: '2018',
      }).save(),
      Diary({
        author: 'Author3',
        text: 'Diary03-01',
        colloquialDate: '03-01',
        locale: 'be',
      }).save(),
    ]);
  });

  after(dropData);

  describe('# Diary CRUD', () => {
    it('get an existing diary with prev and next', () =>
      request
        .get('/api/specials/diary/be/02/28/')
        .expect(200)
        .expect(({ body: { data, prev, next } }) => {
          expect(data.author).to.equal('Author2');
          expect(data.year).to.equal('2018');
          expect(data.colloquialDate).to.equal('02-28');
          expect(prev).to.equal(true);
          expect(next).to.equal(true);
        }));

    it('get a diary with next only', () =>
      request
        .get('/api/specials/diary/be/02/27')
        .expect(200)
        .expect(({ body: { data, prev, next } }) => {
          expect(data.author).to.equal('Author1');
          expect(prev).to.equal(false);
          expect(next).to.equal(true);
        }));

    it('get a diary with prev only', () =>
      request
        .get('/api/specials/diary/be/03/01')
        .expect(200)
        .expect(({ body: { data, prev, next } }) => {
          expect(data.author).to.equal('Author3');
          expect(prev).to.equal(true);
          expect(next).to.equal(false);
        }));

    it('request unexisting diary', () => request.get('/api/specials/diary/be/02/15').expect(204));
  });
});
