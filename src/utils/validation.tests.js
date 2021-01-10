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
    expect(() => parseYoutubeUrl('https://vimeo.com/197700533').equals(null)));

  it('should not accept youtube video url with broken videoId', () =>
    expect(() => parseYoutubeUrl('https://www.youtube.com/watch?v=LOOOL').equals(null)));

  it('should accept youtube video url [reqular]', () =>
    expect(parseYoutubeUrl('https://www.youtube.com/watch?v=OUGvR8UVlSU')).equals('OUGvR8UVlSU'));

  it('should accept youtube video url [reqular with space after]', () =>
    expect(parseYoutubeUrl('https://www.youtube.com/watch?v=OUGvR8UVlSU ')).equals('OUGvR8UVlSU'));

  it('should accept youtube video url [short]', () => {
    expect(parseYoutubeUrl('https://youtu.be/yrQqzzoeW28')).equals('yrQqzzoeW28');
  });

  it('should accept youtube video url [short with spaces after]', () => {
    expect(parseYoutubeUrl('https://youtu.be/yrQqzzoeW28  ')).equals('yrQqzzoeW28');
  });

  it('should accept youtube video url [embed]', () => {
    expect(parseYoutubeUrl('http://www.youtube.com/embed/yrQqzzoeW28?rel=0')).equals('yrQqzzoeW28');
  });

  it('should accept youtube video url [with timing]', () => {
    expect(parseYoutubeUrl('http://www.youtube.com/watch?v=yrQqzzoeW28#t=0m10s')).equals(
      'yrQqzzoeW28'
    );
  });

  it('should accept youtube video url [with params 1]', () => {
    expect(
      parseYoutubeUrl('http://www.youtube.com/v/yrQqzzoeW28?fs=1&amp;hl=en_US&amp;rel=0')
    ).equals('yrQqzzoeW28');
  });

  it('should accept youtube video url [with params 2]', () => {
    expect(
      parseYoutubeUrl('https://www.youtube.com/watch?v=yrQqzzoeW28&t=76s&ab_channel=WIRBY')
    ).equals('yrQqzzoeW28');
  });

  it('should accept youtube video url [with params 3]', () => {
    expect(
      parseYoutubeUrl(
        'https://www.youtube.com/watch?v=btU2yrXImwU&list=PLTyr03fqb0qMIzQnXFCx786QvCG5fyKFC&ab_channel=WIRBY'
      )
    ).equals('btU2yrXImwU');
  });

  it('should not accept youtube video url with broken ID and params', () => {
    expect(
      parseYoutubeUrl(
        'https://www.youtube.com/watch?v=btU2yrXI&list=PLTyr03fqb0qMIzQnXFCx786QvCG5fyKFC&ab_channel=WIRBY'
      )
    ).equals(null);
  });
});
