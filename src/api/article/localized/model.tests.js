import mongoose from 'mongoose';

import { expect, dropData, loginTestAdmin, defaultObjectMetadata, spy } from 'utils/testing';

import 'db/connect';

import LocalizedArticle from './model';

describe('LocalizedArticle model', () => {
  let metadata;

  before(async function() {
    this.timeout(5000);
    await dropData();

    await loginTestAdmin();
    metadata = await defaultObjectMetadata();
  });

  it('should fail to save article | no locale', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
      expect(message.locale).to.includes('required');
    });

    await LocalizedArticle({
      articleId: mongoose.Types.ObjectId().toString(),
      title: 'Title',
      subtitle: 'Subtitle',
      slug: 'slug1',
      metadata,
    })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });
});
