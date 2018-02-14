import supertest from 'supertest';
import { expect } from 'chai';

import app from 'server';
import 'db/connect';

import { dropData } from 'utils/testing';

import Diary from './model';

const request = supertest.agent(app.listen());

describe('Diary API', () => {
  before(async () => {
    await Diary({
      author: 'TestAuthor',
      text: 'SomeDiary',
      colloquialDate: '2018-02-14',
      locale: 'be',
    }).save();
  });

  after(dropData);

  describe('# Diary CRUD', () => {
    it('get an existing diary', () =>
      request
        .get('/api/specials/diary/2018/02/14/')
        .expect(200)
        .expect(res => {
          expect(res.body.author).to.equal('TestAuthor');
        }));

    it('request unexisting diary', () => request.get('/api/specials/diary/2018/02/15').expect(404));
  });
});
