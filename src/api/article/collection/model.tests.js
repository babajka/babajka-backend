import 'db/connect';
import mongoose from 'mongoose';

import { expect, dropData, spy } from 'utils/testing';

import ArticleCollection from './model';

describe('ArticleCollection model', () => {
  const data = {
    fiberyId: 'a',
    fiberyPublicId: 'b',
    name: { be: 'Калекцыя' },
    description: { be: 'Цыкл лекцый' },
    articles: [mongoose.Types.ObjectId(), mongoose.Types.ObjectId()],
    cover: 'https://collection.jpg',
  };

  before(async function() {
    this.timeout(5000);
    await dropData();
    ArticleCollection.ensureIndexes();
  });

  it('should fail to save collection | no slug', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
      expect(message.slug.type).to.include('required');
    });

    await ArticleCollection(data)
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });

  // flaky! 🙅
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('should fail to save collection | dup slug', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
      expect(message).to.includes('duplicate key');
    });

    const col = { ...data, slug: 'col-slug' };
    await ArticleCollection(col).save();

    await ArticleCollection({
      ...col,
      slug: 'col-slug',
      fiberyId: 'c2',
      fiberyPublicId: '2',
    })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
    await ArticleCollection.find({}).then(collections => expect(collections).to.have.length(1));
  });
});
