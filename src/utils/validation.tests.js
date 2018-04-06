import { expect } from 'chai';

import { slugValidator } from './validation';

describe('Slug Validation Tests', () => {
  const validate = slugValidator.validator;

  it('should not accept empty strings', () => expect(validate('')).to.be.false);

  it('should not accept some special characters', () =>
    expect(validate('hello$world?f')).to.be.false);

  it('should accept alphnumeric', () => expect(validate('regular-slug_01')).to.be.true);

  it('should not accept cyrillic slug', () => expect(validate('прывітанне-слаг-05')).to.be.false);
});
