import { expect } from 'chai';

import { cutSizing } from './validation';

describe('Validation Tests', () => {
  it('should return a string with no sz param', () =>
    expect(cutSizing('https://googleapis.com/imageUrl?sz=50')).to.equal(
      'https://googleapis.com/imageUrl'
    ));
});
