import keyBy from 'lodash/keyBy';

import {
  supertest,
  expect,
  dropData,
  loginTestAdmin,
  addBrand,
  addTopics,
  defaultObjectMetadata,
} from 'utils/testing';

import app from 'server';

import 'db/connect';

import { Article } from 'api/article';

import Tag from './model';

const request = supertest.agent(app.listen());

describe('Tag model', () => {
  let defaultMetadata;
  let topics;

  // eslint-disable-next-line func-names
  before(async function() {
    // I should probably avoid these lines.
    this.timeout(5000);
    await dropData();

    await loginTestAdmin();
    defaultMetadata = await defaultObjectMetadata();

    topics = keyBy(await addTopics(defaultMetadata), 'slug');
  });

  after(dropData);

  it('should fail to save locations tag | no title', () =>
    Tag({
      topic: topics.locations._id,
      content: {
        images: 'imageurl',
      },
      metadata: defaultMetadata,
      slug: 'slug0',
    })
      .save()
      .catch(({ status, message: { errors } }) => {
        expect(status).to.equal(400);
        expect(errors).to.not.empty();
        expect(errors.title).to.include('required');
      }));

  it('should fail to save locations tag | no BE title', () =>
    Tag({
      topic: topics.locations._id,
      content: {
        images: 'imageurl',
        title: {
          en: 'en-title',
        },
      },
      metadata: defaultMetadata,
      slug: 'slug1',
    })
      .save()
      .catch(({ status, message: { errors } }) => {
        expect(status).to.equal(400);
        expect(errors).to.not.empty();
        expect(errors.title.be).to.include('required');
      }));

  it('should fail to save personalities tag | bad color', () =>
    Tag({
      topic: topics.personalities._id,
      content: {
        name: { be: 'Kolas' },
        dates: { be: 'forever' },
        image: 'image-url',
        color: 'black',
        description: { be: 'description' },
      },
      metadata: defaultMetadata,
      slug: 'kolas',
    })
      .save()
      .catch(({ status, message: { errors } }) => {
        expect(status).to.equal(400);
        expect(errors).to.not.empty();
        expect(errors.color).to.include('regex');
      }));
});

describe('Tags API', () => {
  let articleTwoTags;
  let articleOneTag;

  // eslint-disable-next-line func-names
  before(async function() {
    // I should probably avoid these lines.
    this.timeout(5000);
    await dropData();

    await loginTestAdmin();
    const defaultMetadata = await defaultObjectMetadata();

    const topics = keyBy(await addTopics(defaultMetadata), 'slug');

    const tags = {};

    await Promise.all(
      [
        {
          topic: topics.locations._id,
          slug: 'miensk',
          content: { title: { be: 'Менск' }, image: 'link-to-an-image' },
          metadata: defaultMetadata,
        },
        {
          topic: topics.times._id,
          slug: 'xx-century',
          content: { title: { be: 'ХХ стагоддзе', en: 'XX century' } },
          metadata: defaultMetadata,
        },
      ].map(data =>
        Tag(data)
          .save()
          .then(({ _id, slug }) => {
            tags[slug] = _id;
          })
      )
    );

    const brand = await addBrand();

    articleTwoTags = await Article({
      brand: brand._id,
      type: 'text',
      imagePreviewUrl: 'image-url',
      metadata: defaultMetadata,
      publishAt: new Date('2018-01-21T16:25:43.511Z'),
      tags: [tags.miensk, tags['xx-century']],
    })
      .save()
      .then(({ _id }) => _id.toString());

    articleOneTag = await Article({
      brand: brand._id,
      type: 'text',
      imagePreviewUrl: 'image-url',
      metadata: defaultMetadata,
      publishAt: new Date('2018-01-22T16:25:43.511Z'),
      tags: [tags.miensk],
    })
      .save()
      .then(({ _id }) => _id.toString());
  });

  after(dropData);

  it('should get locations tags by topic', () =>
    request
      .get('/api/tags/byTopic/locations')
      .expect(200)
      .expect(({ body }) => {
        expect(body).to.have.length(1);
        const tag = body[0];
        expect(tag.topic.slug).to.equal('locations');
        expect(tag.slug).to.equal('miensk');
        expect(tag.content.title.be).to.equal('Менск');
        expect(tag.content.image).to.contain('link');
      }));

  it('should get times tags by topic', () =>
    request
      .get('/api/tags/byTopic/times')
      .expect(200)
      .expect(({ body }) => {
        expect(body).to.have.length(1);
        const tag = body[0];
        expect(tag.topic.slug).to.equal('times');
        expect(tag.slug).to.equal('xx-century');
        expect(tag.content.title.be).to.contain('стагоддзе');
        expect(tag.content.title.en).to.contain('century');
      }));

  it('should get an error for unsupported topic', () =>
    request
      .get('/api/tags/byTopic/randomTopic')
      .expect(400)
      .expect(({ body: { error } }) => {
        expect(error.topic).to.contain('not supported');
      }));

  it('should return article with two tags populated', () =>
    request
      .get(`/api/articles/${articleTwoTags}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.tags).to.have.length(2);
        expect(body.tags.map(({ slug }) => slug)).to.deep.equal(['miensk', 'xx-century']);
      }));

  it('should return two articles by tag', () =>
    request
      .get('/api/tags/articles/miensk')
      .expect(200)
      .expect(({ body }) => {
        expect(body).to.have.length(2);
        expect(body.map(({ _id }) => _id)).to.deep.equal([articleOneTag, articleTwoTags]);
      }));

  it('should return one article by tag', () =>
    request
      .get('/api/tags/articles/xx-century')
      .expect(200)
      .expect(({ body }) => {
        expect(body).to.have.length(1);
        expect(body[0]._id).to.equal(articleTwoTags);
      }));
});
