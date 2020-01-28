import 'db/connect';
import {
  expect,
  dropData,
  spy,
  addPersonalityTag,
  defaultObjectMetadata,
  addTopics,
  addAdminUser,
} from 'utils/testing';
import { getId } from 'utils/getters';

import Diary from './model';

describe('Diary Model', () => {
  let author;

  before(async () => {
    await dropData();
    await addAdminUser();
    const metadata = await defaultObjectMetadata();
    await addTopics(metadata);
    author = await addPersonalityTag(metadata);
  });

  it('should fail to create diary with invalid date', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
      const { colloquialDateHash: hash } = message;
      expect(hash.type).to.equal('colloquialDateHash.invalid');
      expect(hash.message).to.contain('should be in MMDD format');
    });

    await Diary({
      author: getId(author),
      text: { content: 'Big brother is watching you' },
      colloquialDateHash: '1984',
      locale: 'en',
    })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });
});
