import supertest from 'supertest';
import { expect } from 'chai';

import app from 'server';
import 'db/connect';

import { dropData } from 'utils/testing';

import ArticleBrand from 'api/article/brand/model';
import User from 'api/user/model';

const request = supertest.agent(app.listen());

describe('Authors API', () => {
  before(async () => {
    await new ArticleBrand({ slug: 'wir' }).save();

    await Promise.all([
      User({ firstName: 'Name', email: 'author1@wir.by', role: 'author' }).save(),
      User({ firstName: 'Name', email: 'author2@wir.by', role: 'author' }).save(),
      User({
        firstName: 'Name',
        email: 'author-non-active@wir.by',
        role: 'author',
        active: false,
      }).save(),
      User({ firstName: 'Name', email: 'regular-user@wir.by' }).save(),
    ]);

    const user = new User({
      firstName: 'Name',
      email: 'test2@babajka.io',
      permissions: { canCreateArticle: true },
    });
    await user.setPassword('password');
    await user.save();
  });

  after(dropData);

  let sessionCookie;

  describe('# Authors basic API', () => {
    it('should return all authors available', () =>
      request
        .get('/api/articles/authors')
        .expect(200)
        .expect(res => {
          expect(res.body).has.length(2);
        }));

    it('should fail to create an author due to lack of permissions', () =>
      request
        .post('/api/articles/authors')
        .send({ bio: 'new bio' })
        .expect(403));

    it('should login with proper permissions', () =>
      request
        .post('/auth/login')
        .send({ email: 'test2@babajka.io', password: 'password' })
        .expect(200)
        .then(res => {
          // eslint-disable-next-line no-unused-expressions
          expect(res.headers['set-cookie']).not.empty;
          [sessionCookie] = res.headers['set-cookie'];
          expect(res.body.email).equal('test2@babajka.io');
        }));

    const generateAuthor = i => {
      it(`should generate an author ${i}`, () =>
        request
          .post('/api/articles/authors')
          .send({ firstName: `Name ${i}` })
          .set('Cookie', sessionCookie)
          .expect(200)
          .expect(res => {
            expect(res.body.email).equal(`generated-author-${i}@wir.by`);
            expect(res.body.firstName).equal(`Name ${i}`);
          }));
    };

    // This is mostly to test if creating is fine with 2-digit numbers.
    for (let i = 0; i <= 11; i++) {
      generateAuthor(i);
    }

    describe('# Associating Authors with Articles', () => {
      it('should create an article with Author', () =>
        request
          .post('/api/articles')
          .send({
            brandSlug: 'wir',
            imageUrl: 'image-url',
            type: 'video',
            authorEmail: 'generated-author-11@wir.by',
          })
          .set('Cookie', sessionCookie)
          .expect(200)
          .expect(res => {
            expect(res.body.type).equal('video');
            expect(res.body.brand.slug).equal('wir');
            expect(res.body.author.email).equal('generated-author-11@wir.by');
            expect(res.body.author.firstName).equal('Name 11');
          }));
    });
  });
});
