import { expect } from 'utils/testing';

import { cutUrlParams } from './formatting';

describe('Formatting Tests', () => {
  it('empty string is provided and is expected', () => expect(cutUrlParams('')).to.equal(''));

  it('should return a string with no sz param', () =>
    expect(cutUrlParams('https://googleapis.com/imageUrl?sz=50')).to.equal(
      'https://googleapis.com/imageUrl'
    ));

  it('a string with multiple question marks', () =>
    expect(cutUrlParams('abc?d=f&f=dh?d')).to.equal('abc'));

  it('a string with no question marks', () =>
    expect(cutUrlParams('https://wir.by')).to.equal('https://wir.by'));
});
