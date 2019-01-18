/* eslint-disable mocha/no-synchronous-tests */
import mongoose from 'mongoose';

import { expect } from 'utils/testing';

import {
  slugValidator,
  permissionsObjectValidator,
  checkMainPageEntitiesFormat,
} from './validation';

describe('Slug Validation Tests', () => {
  const validate = slugValidator.validator;

  it('should not accept empty strings', () => expect(validate('')).to.be.false());

  it('should not accept some special characters', () =>
    expect(validate('hello$world?f')).to.be.false());

  it('should accept alphnumeric', () => expect(validate('regular-slug_01')).to.be.true());

  it('should not accept cyrillic slug', () => expect(validate('прывітанне-слаг-05')).to.be.false());
});

describe('Permissions Object Validation Tests', () => {
  const validate = permissionsObjectValidator.validator;

  it('should not accept empty array', () => expect(validate([])).to.be.false());

  it('should not accept non-empty array', () =>
    expect(validate(['canCreateArticle'])).to.be.false());

  it('should not accept non-object', () => expect(validate('canCreateArticle')).to.be.false());

  it('should accept empty object', () => expect(validate({})).to.be.true());

  it('should accept object with one permission', () =>
    expect(validate({ canCreateArticle: true })).to.be.true());

  it('should accept object with multiple permissions', () =>
    expect(validate({ canCreateArticle: true, canManageArticles: false })).to.be.true());

  it('should not accept object with non-boolean value of permission', () =>
    expect(validate({ canCreateArticle: 'no' })).to.be.false());
});

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
      checkMainPageEntitiesFormat({ articles: [sampleObjectId, sampleObjectId] })
    ).to.be.true());
});
