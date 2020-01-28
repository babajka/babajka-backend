import 'db/connect';
import { expect, dropData, loginTestAdmin, defaultObjectMetadata, addTopics } from 'utils/testing';

import { TOPIC_SLUGS } from 'constants/topic';
import Topic from './model';

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
