import HttpStatus from 'http-status-codes';

import { supertest, expect, dropData, loginTestAdmin, addBrand } from 'utils/testing';

import app from 'server';
import 'db/connect';

import User from 'api/user/model';

const request = supertest.agent(app.listen());

describe('Authors API', () => {
  let sessionCookie;

  before(async () => {
    await addBrand();
    await Promise.all(
      [
        { firstName: 'Name', email: 'author1@babajka.io', role: 'author' },
        { firstName: 'Name', email: 'author2@babajka.io', role: 'author' },
        { firstName: 'Name', email: 'author-non-active@babajka.io', role: 'author', active: false },
        { firstName: 'Name', email: 'regular-user@babajka.io' },
      ].map(userData => User(userData).save())
    );
    sessionCookie = await loginTestAdmin();
  });

  after(dropData);

  describe('# Authors basic API', () => {
    it('should return all authors available', () =>
      request
        .get('/api/articles/authors')
        .expect(HttpStatus.OK)
        .expect(res => {
          expect(res.body).has.length(2);
        }));

    it('should fail to create an author due to lack of permissions', () =>
      request
        .post('/api/articles/authors')
        .send({ bio: 'new bio' })
        .expect(HttpStatus.FORBIDDEN));

    const generateAuthor = i => {
      it(`should generate an author ${i}`, () =>
        request
          .post('/api/articles/authors')
          .send({ firstName: `Name ${i}` })
          .set('Cookie', sessionCookie)
          .expect(HttpStatus.OK)
          .expect(res => {
            expect(res.body.email).equal(`generated-author-${i}@wir.by`);
            expect(res.body.firstName).equal(`Name ${i}`);
          }));
    };

    // This is mostly to test if creating is fine with 2-digit numbers.
    for (let i = 0; i <= 11; i += 1) {
      generateAuthor(i);
    }

    describe('# Associating Authors with Articles', () => {
      it('should create an article with Author', () =>
        request
          .post('/api/articles')
          .send({
            brandSlug: 'wir',
            imagePreviewUrl: 'image-url',
            type: 'video',
            authorEmail: 'generated-author-11@wir.by',
            videoUrl: 'https://www.youtube.com/watch?v=1234567890x',
          })
          .set('Cookie', sessionCookie)
          .expect(HttpStatus.OK)
          .expect(res => {
            expect(res.body.type).equal('video');
            expect(res.body.brand.slug).equal('wir');
            expect(res.body.author.email).equal('generated-author-11@wir.by');
            expect(res.body.author.firstName).equal('Name 11');
            expect(res.body.video.platform).equal('youtube');
            expect(res.body.video.videoId).equal('1234567890x');
          }));
    });
  });
});
