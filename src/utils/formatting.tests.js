import { expect } from 'utils/testing';

import { cutUrlParams, snakeToCamel } from './formatting';

describe('Formatting Tests', () => {
  it('should work with empty string', () => expect(cutUrlParams('')).to.equal(''));

  it('should cut a string with sz param', () =>
    expect(cutUrlParams('https://googleapis.com/imageUrl?sz=50')).to.equal(
      'https://googleapis.com/imageUrl'
    ));

  it('should cut a string with multiple question marks', () =>
    expect(cutUrlParams('abc?d=f&f=dh?d')).to.equal('abc'));

  it('should cut a string with no question marks', () =>
    expect(cutUrlParams('https://wir.by')).to.equal('https://wir.by'));

  it('should transform snakeToCamel', () =>
    expect(snakeToCamel('this_is_snake-string_02')).to.equal('thisIsSnakeString02'));
});
