import {
  expect,
  dropData,
  loginTestAdmin,
  defaultObjectMetadata,
  addTopics,
  spy,
} from 'utils/testing';

import 'db/connect';

import { TOPIC_SLUGS } from 'constants/topic';
import Topic from './model';

describe('Topic model', () => {
  let metadata;

  before(async function() {
    this.timeout(5000);
    await dropData();

    await loginTestAdmin();
    metadata = await defaultObjectMetadata();
  });

  it('should fail to save unknown topic', async () => {
    const errorHandler = spy(({ errors, message }) => {
      expect(message).to.not.empty();
      expect(errors.slug.value).to.be.equal('RANDOM_TOPIC');
    });

    await Topic({ slug: 'RANDOM_TOPIC', metadata })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });

  // FIXME
  // eslint-disable-next-line
  it.skip('should fail to save topic with same slug', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
    });

    await Topic({ slug: 'themes', metadata }).save();
    await Topic({ slug: 'themes', metadata })
      .save()
      .catch(errorHandler);
    // [
    //   { _id: 5d597b4c965e6602d21fcfc7, slug: 'themes' },
    //   { _id: 5d597b4c965e6602d21fcfc8, slug: 'themes' }
    // ]
    await Topic.getAll().then(obj => expect(obj).to.have.length(1));
    expect(errorHandler).to.have.been.called();
  });
});

describe('Topic Helpers', () => {
  before(async () => {
    await dropData();

    await loginTestAdmin();
    const metadata = await defaultObjectMetadata();
    await addTopics(metadata);
  });

  it('should get all topics', () =>
    Topic.getAll().then(obj => expect(obj).to.have.length(TOPIC_SLUGS.length)));
});
