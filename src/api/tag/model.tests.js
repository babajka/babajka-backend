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
} from 'utils/testing';

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

  it('should fail to save locations tag | no title', async () => {
    const errorHandler = spy(({ status, message }) => {
      expect(status).to.equal(HttpStatus.BAD_REQUEST);
      expect(message).to.not.empty();
      expect(message.title).to.include('required');
    });

    await Tag({
      topic: topics.locations._id,
      content: {
        image: 'imageurl',
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
      expect(message.title.be).to.include('required');
    });

    await Tag({
      topic: topics.locations._id,
      content: {
        image: 'imageurl',
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
      expect(message).to.includes('duplicate key');
    });

    const data = {
      topic: topics.times._id,
      content: {
        title: { be: 'XX стагоддзе' },
      },
      metadata,
      slug: 'xx-century',
    };

    await Tag(data).save();
    await Tag(data)
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
    await Tag.find({}).then(tags => expect(tags).to.have.length(1));
  });

  it('should fail to save personalities tag | bad color', async () => {
    const errorHandler = spy(({ status, message }) => {
      expect(status).to.equal(HttpStatus.BAD_REQUEST);
      expect(message).to.not.empty();
      expect(message.color).to.include('regex');
    });

    await Tag({
      topic: topics.personalities._id,
      content: {
        name: { be: 'Kolas' },
        dates: { be: 'forever' },
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

  it('should fail to save author tag | no BE bio', async () => {
    const errorHandler = spy(({ status, message }) => {
      expect(status).to.equal(HttpStatus.BAD_REQUEST);
      expect(message).to.not.empty();
      expect(message.bio.be).to.include('required');
    });

    await Tag({
      topic: topics.authors._id,
      content: {
        firstName: { be: 'George' },
        lastName: { be: 'Orwell' },
        bio: { en: '1984' },
        image: 'image-url',
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
      expect(message.image).to.include('required');
    });

    await Tag({
      topic: topics.brands._id,
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
