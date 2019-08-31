import 'db/connect';
import mongoose from 'mongoose';

import { expect, dropData, spy } from 'utils/testing';

import ArticleCollection from './model';

describe('ArticleCollection model', () => {
  const data = {
    name: { be: 'Калекцыя' },
    description: { be: 'Цыкл лекцый' },
    articles: [mongoose.Types.ObjectId(), mongoose.Types.ObjectId()],
    imageUrl: 'https://collection.jpg',
  };

  before(dropData);

  it('should fail to save collection | no slug', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
      expect(message.slug).to.include('required');
    });

    await ArticleCollection(data)
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });
});
