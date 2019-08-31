import 'db/connect';
import { expect, dropData, spy } from 'utils/testing';

import Diary from './model';

describe('Diary Model', () => {
  before(dropData);

  it('should fail to create diary with invalid date', async () => {
    const errorHandler = spy(({ message }) => {
      // TODO: fix message
      expect(message.colloquialDateHash).to.equal('number.colloquialDateHash');
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
