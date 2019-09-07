/* eslint-disable mocha/no-synchronous-tests */
import mongoose from 'mongoose';

import { expect } from 'utils/testing';
import parseYoutubeUrl from 'lib/utils/parseYoutubeUrl';

import { checkMainPageEntitiesFormat } from './validation';

describe('Main Page State Validation Tests', () => {
  const sampleObjectId = mongoose.Types.ObjectId().toString();

  it('should not accept with broken id', () =>
    expect(checkMainPageEntitiesFormat({ articles: [`${sampleObjectId}x`] })).to.be.false());

  it('should not accept with bad key', () =>
    expect(checkMainPageEntitiesFormat({ hello: [sampleObjectId] })).to.be.false());

  it('should not accept with invalid structure', () =>
    expect(checkMainPageEntitiesFormat({ articles: { sample: 123 } })).to.be.false());

  it('should not accept with bad extension', () =>
    expect(
      checkMainPageEntitiesFormat({ articles: [sampleObjectId], hello: ['world'] })
    ).to.be.false());

  it('should accept', () =>
    expect(
      checkMainPageEntitiesFormat({
        articles: [sampleObjectId, sampleObjectId],
        tags: [sampleObjectId],
      })
    ).to.be.true());
});

describe('Video: parseYoutubeUrl', () => {
  it('should not accept non-youtube video url', () =>
    expect(() => parseYoutubeUrl('https://vimeo.com/197700533').to.equal(null)));

  it('should not accept youtube video url with broken videoId', () =>
    expect(() => parseYoutubeUrl('https://www.youtube.com/watch?v=LOOOL').to.equal(null)));

  it('should accept youtube video url', () =>
    expect(
      parseYoutubeUrl('https://www.youtube.com/watch?v=OUGvR8UVlSU').to.be.equal('OUGvR8UVlSU')
    ));
});
