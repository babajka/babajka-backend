import HttpError from 'node-http-error';
import isEmpty from 'lodash/isEmpty';
import set from 'lodash/set';
import mongoose from 'mongoose';

export const ValidationError = message => HttpError(400, message);

// TODO(uladbohdan): to replace messages with error codes.

const createArticleValidator = ({ body }, res, next) => {
  const errors = {};
  if (body.locales) {
    Object.entries(body.locales).forEach(([locale, localeData]) => {
      ['title', 'subtitle', 'slug', 'text'].forEach(field => {
        if (!localeData[field]) {
          set(errors, ['locales', locale, field], 'must be presented');
        }
      });
      if (localeData.locale && locale !== localeData.locale) {
        errors.localeConsistency = `bad locale consistency: ${locale} vs. ${localeData.locale}`;
      }
    });
  }

  return next(!isEmpty(errors) && new ValidationError(errors));
};

const updateArticleValidator = ({ body }, res, next) => {
  const errors = {};

  ['brandSlug', 'type', 'imageUrl'].forEach(field => {
    if (body[field] === '') {
      errors[field] = 'forbidden to remove';
    }
  });

  if (body.locales) {
    Object.entries(body.locales).forEach(([locale, localeData]) => {
      ['title', 'subtitle', 'slug', 'text', 'locale'].forEach(field => {
        if (localeData[field] === '') {
          set(errors, ['locales', locale, field], 'forbidden to remove');
        }
      });
      if (localeData.locale && localeData.locale !== locale) {
        errors.localeConsistency = `bad locale consistency: ${locale} vs. ${localeData.locale}`;
      }
    });
  }

  return next(!isEmpty(errors) && new ValidationError(errors));
};

export const precheck = {
  createArticle: createArticleValidator,
  updateArticle: updateArticleValidator,
};

export const requireFields = (...fields) => (req, res, next) => {
  const errors = {};

  fields.forEach(field => {
    if (!req.body[field]) {
      errors[field] = `поле ${field} абавязковае`;
    }
  });

  return next(!isEmpty(errors) && new ValidationError(errors));
};

export const checkIsFound = (object, code = 404) => {
  if (!object) {
    throw new HttpError(code);
  }
  return object;
};

export const isValidId = id => mongoose.Types.ObjectId.isValid(id);

export const slugValidator = {
  validator: v => /^[a-zA-Z0-9_-]+$/.test(v),
  message: 'failed to match regexp',
};

export const colloquialDateHashValidator = {
  // Colloquial Date Hash has MMDD format.
  validator: v => {
    const month = parseInt(v, 10) / 100;
    const day = parseInt(v, 10) % 100;
    return month >= 0 && month <= 12 && day >= 0 && day <= 31;
  },
  message: 'failed to match regexp',
};
