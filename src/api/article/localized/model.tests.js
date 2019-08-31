import 'db/connect';
import mongoose from 'mongoose';
import omit from 'lodash/omit';

import { expect, dropData, addAdminUser, defaultObjectMetadata, spy } from 'utils/testing';

import LocalizedArticle from './model';

describe('LocalizedArticle model', () => {
  let data;

  before(async function() {
    this.timeout(5000);
    await dropData();

    await addAdminUser();
    const metadata = await defaultObjectMetadata();
    data = {
      articleId: mongoose.Types.ObjectId().toString(),
      title: 'Title',
      subtitle: 'Subtitle',
      slug: 'slug1',
      text: {},
      metadata,
    };
  });

  it('should fail to save article | no text', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
      expect(message.text).to.includes('required');
    });

    await LocalizedArticle(omit(data, 'text'))
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });

  it('should fail to save article | no locale', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
      expect(message.locale).to.includes('required');
    });

    await LocalizedArticle(data)
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });

  it('should fail to save article | unsupported locale', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
      expect(message.locale).to.includes('allowOnly');
    });

    await LocalizedArticle({ ...data, locale: 'fr' })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });
});
