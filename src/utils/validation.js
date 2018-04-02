import HttpError from 'node-http-error';
import isEmpty from 'lodash/isEmpty';
import mongoose from 'mongoose';

export const ValidationError = message => HttpError(400, message);

// TODO(uladbohdan): to replace messages with error codes.

// These are the drafts for validators.
// TODO(uladbohdan): to refactor, to extend.

// TODO(uladbohdan): to figure out nesting in errors object.

const createArticleValidator = ({ body }, res, next) => {
  const errors = {};
  if (body.locales) {
    Object.keys(body.locales).forEach(loc => {
      ['title', 'subtitle', 'slug', 'text', 'locale'].forEach(field => {
        if (!body.locales[loc][field]) {
          errors[field] = 'must be presented';
        }
      });
      if (loc !== body.locales[loc].locale) {
        errors.localeConsistency = `bad locale structuring: ${loc} vs. ${body.locales[loc].locale}`;
      }
    });
  }
  if (!isEmpty(errors)) {
    return next(new ValidationError(errors));
  }
  return next();
};

const updateArticleValidator = ({ body }, res, next) => {
  const errors = {};

  ['brandSlug', 'type'].forEach(field => {
    if (body[field] === '') {
      errors[field] = 'you cannot remove the field';
    }
  });
  if (body.locales) {
    Object.keys(body.locales).forEach(loc => {
      ['title', 'subtitle', 'slug', 'text', 'locale'].forEach(field => {
        if (body.locales[loc][field] === '') {
          errors[field] = 'you cannot remove the field';
        }
      });
    });
  }
  if (!isEmpty(errors)) {
    return next(new ValidationError(errors));
  }
  return next();
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

  if (!isEmpty(errors)) {
    return next(new ValidationError(errors));
  }
  return next();
};

export const checkIsFound = object => {
  if (!object) {
    throw new HttpError(404);
  }
  return object;
};

export const checkDiaryIsFound = object => {
  if (!object) {
    throw new HttpError(204);
  }
  return object;
};

export const isValidId = id => mongoose.Types.ObjectId.isValid(id);

export const slugValidator = {
  validator: v => /^[a-zA-Z0-9_-]+$/.test(v),
  message: 'failed to match regexp',
};

export const colloquialDateValidator = {
  // Colloquial Date has MM-DD format.
  validator: v => /\d{2}-\d{2}/.test(v),
  message: 'failed to match regexp',
};
