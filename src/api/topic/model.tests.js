import 'db/connect';
import { expect, dropData, loginTestAdmin, defaultObjectMetadata, spy } from 'utils/testing';

import Topic from './model';

describe('Topic model', () => {
  let metadata;

  before(async function() {
    this.timeout(5000);
    await dropData();

    Topic.ensureIndexes();

    await loginTestAdmin();
    metadata = await defaultObjectMetadata();
  });

  it('should fail to save unknown topic', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message.slug.type).to.include('allowOnly');
    });

    await Topic({ slug: 'RANDOM_TOPIC', metadata })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });

  it('should fail to save topic | dup slug', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
      expect(message).to.include('duplicate key');
    });

    await Topic({ slug: 'themes', metadata }).save();
    await Topic({ slug: 'themes', metadata })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
    await Topic.getAll().then(topics => expect(topics).to.have.length(1));
  });
});
