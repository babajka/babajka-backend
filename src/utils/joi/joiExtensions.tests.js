import { expect } from 'utils/testing';

import Joi from './index';

const getValidator = joiModel => v => {
  const { error } = Joi.validate(v, joiModel);
  return !error;
};

describe('Joi.slug', () => {
  const validate = getValidator(Joi.slug());

  it('should not accept empty strings', () => expect(validate('')).to.be.false());
  it('should not accept some special characters', () =>
    expect(validate('hello$world?f')).to.be.false());
  it('should accept alphnumeric', () => expect(validate('regular-slug_01')).to.be.true());
  it('should not accept cyrillic slug', () => expect(validate('прывітанне-слаг-05')).to.be.false());
});

describe('Joi.iamge', () => {
  const validate = getValidator(Joi.image());

  it('should not accept empty strings', () => expect(validate('')).to.be.false());
  it('should not accept filename', () => expect(validate('lol-kek.jpg')).to.be.false());
  it('should not accept non-url', () => expect(validate('23 4234 23432')).to.be.false());
  it('should accept valid url', () => expect(validate('http://wir.by/kino.jpg')).to.be.true());
  it('should accept api/files url', () => expect(validate('/api/files/12323423')).to.be.true());
});

describe('Joi.locale', () => {
  const validate = getValidator(Joi.locale());

  it('should not accept empty strings', () => expect(validate('')).to.be.false());
  it('should not accept unknown locale', () => expect(validate('fr')).to.be.false());
  it('should accept be', () => expect(validate('be')).to.be.true());
  it('should accept ru', () => expect(validate('ru')).to.be.true());
  it('should accept en', () => expect(validate('en')).to.be.true());
});

describe('Joi.colloquialDateHash', () => {
  const validate = getValidator(Joi.colloquialDateHash());

  it('should not accept empty strings', () => expect(validate('')).to.be.false());
  it('should not accept wrong format', () => expect(validate('11/01/1997')).to.be.false());
  it('should not accept 111111', () => expect(validate(111111)).to.be.false());
  it('should not accept 1984', () => expect(validate('1984')).to.be.false());
  it('should accept valid date/month', () => expect(validate('0101')).to.be.true());
  it('should accept valid date/month as number', () => expect(validate(1001)).to.be.true());
});

describe('Joi.color', () => {
  const validate = getValidator(Joi.color());

  it('should not accept color without hash', () => expect(validate('000000')).to.be.false());
  it('should not accept short strings', () => expect(validate('#abf6')).to.be.false());
  it('should not accept long strings', () => expect(validate('#12345678')).to.be.false());
  it('should not accept forbidden symbols', () => expect(validate('#12zfab')).to.be.false());
  it('should accept valid hex color', () => expect(validate('#a8a8ff')).to.be.true());
});

describe('Joi.localizedText', () => {
  const validate = getValidator(Joi.localizedText());

  it('should not accept empty object', () => expect(validate({})).to.be.false());
  it('should not accept string', () => expect(validate('some text')).to.be.false());
  it('should not accept without be', () => expect(validate({ en: 'en', ru: 'ru' })).to.be.false());
  it('should not accept non string value', () => expect(validate({ be: true })).to.be.false());
  it('should not accept unknown locale', () =>
    expect(validate({ be: 'be', fr: 'fr' })).to.be.false());
  it('should accept valid object', () =>
    expect(validate({ be: 'be', ru: 'ru', en: 'en' })).to.be.true());
});

describe('Joi.userPermissions', () => {
  const validate = getValidator(Joi.userPermissions());

  it('should not accept empty array', () => expect(validate([])).to.be.false());
  it('should not accept non-empty array', () =>
    expect(validate(['canCreateArticle'])).to.be.false());
  it('should not accept non-object', () => expect(validate('canCreateArticle')).to.be.false());
  it('should have default', () => expect(validate()).to.be.true());
  it('should accept empty object', () => expect(validate({})).to.be.true());
  it('should accept object with one permission', () =>
    expect(validate({ canCreateArticle: true })).to.be.true());
  it('should accept object with multiple permissions', () =>
    expect(validate({ canCreateArticle: true, canManageArticles: false })).to.be.true());
  it('should not accept object with non-boolean value of permission', () =>
    expect(validate({ canCreateArticle: 'no' })).to.be.false());
});
