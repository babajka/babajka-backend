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

    LocalizedArticle.ensureIndexes();

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
      expect(message.text.type).to.include('required');
    });

    await LocalizedArticle(omit(data, 'text'))
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });

  it('should fail to save article | no locale', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
      expect(message.locale.type).to.include('required');
    });

    await LocalizedArticle(data)
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });

  it('should fail to save article | unsupported locale', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
      expect(message.locale.type).to.include('allowOnly');
    });

    await LocalizedArticle({ ...data, locale: 'fr' })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });

  it('should fail to save article | dup slug', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
      expect(message).to.include('duplicate key');
    });

    const article = { ...data, locale: 'be' };
    await LocalizedArticle(article).save();
    await LocalizedArticle(article)
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
    await LocalizedArticle.find({}).then(articles => expect(articles).to.have.length(1));
  });
});
