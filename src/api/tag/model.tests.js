import 'db/connect';
import HttpStatus from 'http-status-codes';
import keyBy from 'lodash/keyBy';

import {
  expect,
  dropData,
  loginTestAdmin,
  addTopics,
  defaultObjectMetadata,
  spy,
  IMAGE_URL,
} from 'utils/testing';
import { getId } from 'utils/getters';

import Tag from './model';

describe('Tag model', () => {
  let metadata;
  let topics;

  before(async function() {
    this.timeout(5000);
    await dropData();

    Tag.ensureIndexes();

    await loginTestAdmin();
    metadata = await defaultObjectMetadata();

    topics = keyBy(await addTopics(metadata), 'slug');
  });

  it('should fail to save tag | no topicSlug', async () => {
    const errorHandler = spy(({ status, message }) => {
      expect(status).to.equal(HttpStatus.BAD_REQUEST);
      expect(message).to.not.empty();
      expect(message.topicSlug.type).to.include('required');
    });

    await Tag({
      topic: getId(topics.locations),
      metadata,
      slug: 'slug0',
    })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });

  it('should fail to save tag | no slug', async () => {
    const errorHandler = spy(({ status, message }) => {
      expect(status).to.equal(HttpStatus.BAD_REQUEST);
      expect(message).to.not.empty();
      expect(message.slug.type).to.include('required');
    });

    await Tag({
      topic: getId(topics.locations),
      topicSlug: 'locations',
      metadata,
    })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });

  it('should fail to save locations tag | no title', async () => {
    const errorHandler = spy(({ status, message }) => {
      expect(status).to.equal(HttpStatus.BAD_REQUEST);
      expect(message).to.not.empty();
      expect(message.content.title.type).to.include('required');
    });

    await Tag({
      topic: getId(topics.locations),
      topicSlug: 'locations',
      content: {
        image: IMAGE_URL,
      },
      metadata,
      slug: 'slug0',
    })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });

  it('should fail to save locations tag | no BE title', async () => {
    const errorHandler = spy(({ status, message }) => {
      expect(status).to.equal(HttpStatus.BAD_REQUEST);
      expect(message).to.not.empty();
      expect(message.content.title.be.type).to.include('required');
    });

    await Tag({
      topic: getId(topics.locations),
      topicSlug: 'locations',
      content: {
        image: IMAGE_URL,
        title: {
          en: 'en-title',
        },
      },
      metadata,
      slug: 'slug1',
    })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });

  it('should fail to save tag | dup slug', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
      // FIXME
      expect(message).to.include('duplicate key');
    });

    const data = {
      topic: getId(topics.times),
      topicSlug: 'times',
      content: {
        title: { be: 'XX стагоддзе' },
      },
      metadata,
      slug: 'xx-century',
    };

    await Tag({ ...data, fiberyId: 't1' }).save();
    await Tag({ ...data, fiberyId: 't2' })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
    await Tag.find({}).then(tags => expect(tags).to.have.length(1));
  });

  it('should fail to save personalities tag | bad color', async () => {
    const errorHandler = spy(({ status, message }) => {
      expect(status).to.equal(HttpStatus.BAD_REQUEST);
      expect(message).to.not.empty();
      const { color } = message.content;
      expect(color.type).to.include('regex');
      expect(color.message).to.include('fails to match');
    });

    await Tag({
      topic: getId(topics.personalities),
      topicSlug: 'personalities',
      content: {
        name: { be: 'Kolas' },
        subtitle: { be: 'forever' },
        image: 'image-url',
        color: 'black',
        description: { be: 'description' },
      },
      metadata,
      slug: 'kolas',
    })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });

  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('should fail to save author tag | no BE bio', async () => {
    const errorHandler = spy(({ status, message }) => {
      expect(status).to.equal(HttpStatus.BAD_REQUEST);
      expect(message).to.not.empty();
      expect(message.content.bio.be.type).to.include('required');
    });

    await Tag({
      topic: getId(topics.authors),
      topicSlug: 'authors',
      content: {
        firstName: { be: 'George' },
        lastName: { be: 'Orwell' },
        bio: { en: '1984' },
        image: IMAGE_URL,
      },
      metadata,
      slug: 'orwell',
    })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });

  it('should fail to save brand tag | no image', async () => {
    const errorHandler = spy(({ status, message }) => {
      expect(status).to.equal(HttpStatus.BAD_REQUEST);
      expect(message).to.not.empty();
      expect(message.content.image.type).to.include('required');
    });

    await Tag({
      topic: getId(topics.brands),
      topicSlug: 'brands',
      content: {
        title: { be: 'Adidas' },
      },
      metadata,
      slug: 'adidas',
    })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });
});
