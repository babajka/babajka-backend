import omit from 'lodash/omit';

import {
  expect,
  dropData,
  loginTestAdmin,
  defaultObjectMetadata,
  spy,
  TEST_DATA,
} from 'utils/testing';

import 'db/connect';

import Article from './article.model';

describe('Article model', () => {
  const fiberyIds = { fiberyId: 'a1', fiberyPublicId: '1' };
  let metadata;

  before(async function() {
    this.timeout(5000);
    await dropData();

    await loginTestAdmin();
    metadata = await defaultObjectMetadata();
  });

  it('should fail to save article | no fiberyId', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
      expect(message.fiberyId.type).to.include('required');
    });

    await Article({ type: 'text', metadata })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });

  it('should fail to save article | no images', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
      expect(message.images.type).to.include('required');
    });

    await Article({ ...fiberyIds, type: 'text', metadata })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });

  // for now `no video` -> `type !== 'video'` 🤷
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('should fail to save video article | no video', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
      expect(message.video.type).to.include('required');
    });

    await Article({
      ...fiberyIds,
      type: 'video',
      images: TEST_DATA.articleImages.video,
      metadata,
    })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });

  it('should fail to save video article | no horizontal image', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
      expect(message.images.horizontal.type).to.include('required');
    });

    await Article({
      ...fiberyIds,
      type: 'video',
      video: {
        platform: 'youtube',
        id: TEST_DATA.youtubeId,
        url: TEST_DATA.youtubeLink,
      },
      images: {
        page: TEST_DATA.imageUrl,
      },
      metadata,
    })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });

  it('should fail to save text article | no vertical image', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
      expect(message.images.vertical.type).to.include('required');
    });

    await Article({
      ...fiberyIds,
      type: 'text',
      images: omit(TEST_DATA.articleImages.text, 'vertical'),
      metadata,
    })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });

  it('should fail to save article | invalid image', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
      expect(message.images.page.type).to.include('regex');
    });

    await Article({
      ...fiberyIds,
      type: 'text',
      images: {
        ...TEST_DATA.articleImages.text,
        page: 'ololo',
      },
      metadata,
    })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });
});
