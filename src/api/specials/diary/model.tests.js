import 'db/connect';
import { expect, dropData, spy } from 'utils/testing';

import Diary from './model';

describe('Diary Model', () => {
  before(dropData);

  it('should fail to create diary with invalid date', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
      const { colloquialDateHash: hash } = message;
      expect(hash.type).to.equal('colloquialDateHash.invalid');
      expect(hash.message).to.contain('should be in MMDD format');
    });

    await Diary({
      author: 'George Orwell',
      text: 'Big brother is watching you',
      colloquialDateHash: '1984',
      locale: 'en',
    })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });
});
