import { supertest, expect, dropData, loginTestAdmin, TEST_DATA } from 'utils/testing';

import app from 'server';
import 'db/connect';

import User from 'api/user/model';

const request = supertest.agent(app.listen());

describe('Authors API', () => {
  let sessionCookie;

  before(async function() {
    this.timeout(5000);
    await dropData();

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

  describe('# Authors basic API', () => {
    it('should return all authors available', () =>
      request
        .get('/api/articles/authors')
        .expect(200)
        .expect(({ body }) => {
          expect(body).has.length(2);
        }));

    it('should fail to create an author due to lack of permissions', () =>
      request
        .post('/api/articles/authors')
        .send({ bio: 'new bio' })
        .expect(403));

    const generateAuthor = i => {
      it(`should generate an author ${i}`, () =>
        request
          .post('/api/articles/authors')
          .send({ firstName: `Name ${i}` })
          .set('Cookie', sessionCookie)
          .expect(200)
          .expect(({ body: { email, firstName } }) => {
            expect(email).equal(`generated-author-${i}@wir.by`);
            expect(firstName).equal(`Name ${i}`);
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
            type: 'video',
            images: TEST_DATA.articleImages.video,
            authorEmail: 'generated-author-11@wir.by',
            videoUrl: 'https://www.youtube.com/watch?v=1234567890x',
          })
          .set('Cookie', sessionCookie)
          .expect(200)
          .expect(({ body }) => {
            expect(body.type).equal('video');
            expect(body.author.email).equal('generated-author-11@wir.by');
            expect(body.author.firstName).equal('Name 11');
            expect(body.video.platform).equal('youtube');
            expect(body.video.videoId).equal('1234567890x');
          }));
    });
  });
});
