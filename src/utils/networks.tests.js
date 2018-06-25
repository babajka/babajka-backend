import { expect } from 'chai';

import { parseVideoUrl } from './networks';

describe('Video URL Tests', () => {
  it('should not accept non-youtube video url', () =>
    expect(() => parseVideoUrl('https://vimeo.com/197700533')).to.throw());

  it('should not accept youtube video url with broken videoId', () =>
    expect(() => parseVideoUrl('https://www.youtube.com/watch?v=LOOOL')).to.throw());

  it('should accept youtube video url', () =>
    expect(parseVideoUrl('https://www.youtube.com/watch?v=OUGvR8UVlSU').videoId).to.be.equal(
      'OUGvR8UVlSU'
    ));
});
