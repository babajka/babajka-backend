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
  let metadata;

  before(async function() {
    this.timeout(5000);
    await dropData();

    await loginTestAdmin();
    metadata = await defaultObjectMetadata();
  });

  it('should fail to save article | no images', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
      expect(message.images).to.includes('required');
    });

    await Article({ type: 'text', metadata })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });

  it('should fail to save video article | no video', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
      expect(message).to.includes('video.platform');
    });

    await Article({
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
      expect(message.images.horizontal).to.includes('required');
    });

    await Article({
      type: 'video',
      video: {
        platform: 'youtube',
        videoId: TEST_DATA.youtubeId,
        videoUrl: TEST_DATA.youtubeLink,
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
      expect(message.images.vertical).to.includes('required');
    });

    await Article({
      type: 'text',
      images: TEST_DATA.articleImages.video,
      metadata,
    })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });

  it('should fail to save article | invalid image', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
      expect(message.images.page).to.includes('uri');
    });

    await Article({
      type: 'text',
      images: {
        ...TEST_DATA.articleImages.video,
        page: 'ololo',
      },
      metadata,
    })
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
  });
});
