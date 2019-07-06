import HttpStatus from 'http-status-codes';

import keyBy from 'lodash/keyBy';

import {
  supertest,
  expect,
  dropData,
  loginTestAdmin,
  addTopics,
  defaultObjectMetadata,
  TEST_DATA,
} from 'utils/testing';
import { getId, mapIds } from 'utils/getters';

import app from 'server';
import 'db/connect';
import { Article } from 'api/article';

import Tag from './model';

const request = supertest.agent(app.listen());

describe('Tag model', () => {
  let defaultMetadata;
  let topics;

  before(async function() {
    this.timeout(5000);
    await dropData();

    await loginTestAdmin();
    defaultMetadata = await defaultObjectMetadata();

    topics = keyBy(await addTopics(defaultMetadata), 'slug');
  });

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
      .catch(({ status, message }) => {
        expect(status).to.equal(HttpStatus.BAD_REQUEST);
        expect(message).to.not.empty();
        expect(message.title).to.include('required');
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
      .catch(({ status, message }) => {
        expect(status).to.equal(HttpStatus.BAD_REQUEST);
        expect(message).to.not.empty();
        expect(message.title.be).to.include('required');
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
      .catch(({ status, message }) => {
        expect(status).to.equal(HttpStatus.BAD_REQUEST);
        expect(message).to.not.empty();
        expect(message.color).to.include('regex');
      }));
});

describe('Tags/Topics API', () => {
  let articleTwoTags;
  let articleOneTag;

  before(async function() {
    this.timeout(5000);
    await dropData();

    await loginTestAdmin();
    const defaultMetadata = await defaultObjectMetadata();

    const topics = keyBy(await addTopics(defaultMetadata), 'slug');
    const tags = await Promise.all(
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
      ].map(data => Tag(data).save())
    );
    const tagsIds = tags.reduce((acc, { _id, slug }) => {
      acc[slug] = _id;
      return acc;
    }, {});

    articleTwoTags = await Article({
      type: 'text',
      images: TEST_DATA.articleImages.text,
      metadata: defaultMetadata,
      publishAt: new Date('2018-01-21T16:25:43.511Z'),
      tags: [tagsIds.miensk, tagsIds['xx-century']],
    })
      .save()
      .then(getId);

    articleOneTag = await Article({
      type: 'text',
      images: TEST_DATA.articleImages.text,
      metadata: defaultMetadata,
      publishAt: new Date('2018-01-22T16:25:43.511Z'),
      tags: [tagsIds.miensk],
    })
      .save()
      .then(getId);
  });

  it('should get locations tags by topic', () =>
    request
      .get('/api/tags/by-topic/locations')
      .expect(HttpStatus.OK)
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
      .get('/api/tags/by-topic/times')
      .expect(HttpStatus.OK)
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
      .get('/api/tags/by-topic/randomTopic')
      .expect(HttpStatus.BAD_REQUEST)
      .expect(({ body: { error } }) => {
        expect(error.topic).to.contain('not supported');
      }));

  it('should return article with two tags populated', () =>
    request
      .get(`/api/articles/${articleTwoTags}`)
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body.tags).to.have.length(2);
        expect(body.tags.map(({ slug }) => slug)).to.deep.equal(['miensk', 'xx-century']);
      }));

  it('should return two articles by tag', () =>
    request
      .get('/api/tags/articles/miensk')
      .expect(HttpStatus.OK)
      .expect(({ body: { articles, tag } }) => {
        expect(tag.slug).to.equal('miensk');
        expect(articles).to.have.length(2);
        expect(mapIds(articles)).to.deep.equal([articleOneTag, articleTwoTags]);
      }));

  it('should return one article by tag', () =>
    request
      .get('/api/tags/articles/xx-century')
      .expect(HttpStatus.OK)
      .expect(({ body: { articles } }) => {
        expect(articles).to.have.length(1);
        expect(articles[0]._id).to.equal(articleTwoTags);
      }));

  it('should return articles by topic', () =>
    request
      .get('/api/topics/articles/locations')
      .expect(HttpStatus.OK)
      .expect(({ body: { articles, articlesByTag, tags, topic } }) => {
        expect(topic.slug).to.equal('locations');
        expect(articles).to.have.length(2);
        expect(tags).to.have.length(1);
        expect(tags[0].slug).to.equal('miensk');
        expect(Object.keys(articlesByTag)).to.eql(['miensk']);
        expect(articlesByTag.miensk).to.eql(mapIds(articles));
      }));
});
