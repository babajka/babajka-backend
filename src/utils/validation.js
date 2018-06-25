import HttpError from 'node-http-error';
import isEmpty from 'lodash/isEmpty';
import set from 'lodash/set';
import mongoose from 'mongoose';

export const ValidationError = message => HttpError(400, message);

export const validatePassword = password => {
  if (password.length < 7) {
    throw new ValidationError({ password: 'auth.badPassword' });
  }
};

const createArticleValidator = ({ body }, res, next) => {
  const errors = {};

  ['brand', 'collection'].forEach(field => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      errors[field] = 'frontend is forbidden to send this field to backend';
    }
  });

  if (body.locales) {
    Object.entries(body.locales).forEach(([locale, localeData]) => {
      ['title', 'subtitle', 'slug', 'content'].forEach(field => {
        if (!localeData[field]) {
          set(errors, ['locales', locale, field], 'errors.fieldRequired');
        }
      });
      if (localeData.locale && locale !== localeData.locale) {
        errors.localeConsistency = 'errors.localeInconsistency';
      }
    });
  }

  if (body.type === 'text' && body.videoUrl) {
    errors.video = 'errors.forbiddenForTypeText';
  }

  return next(!isEmpty(errors) && new ValidationError(errors));
};

const updateArticleValidator = ({ body }, res, next) => {
  const errors = {};

  ['brand', 'collection'].forEach(field => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      errors[field] = 'frontend is forbidden to send this field to backend';
    }
  });

  ['brandSlug', 'type', 'imagePreviewUrl'].forEach(field => {
    if (body[field] === '') {
      errors[field] = 'errors.fieldUnremovable';
    }
  });

  if (body.locales) {
    Object.entries(body.locales).forEach(([locale, localeData]) => {
      ['title', 'subtitle', 'slug', 'content', 'locale'].forEach(field => {
        if (localeData[field] === '') {
          set(errors, ['locales', locale, field], 'errors.fieldUnremovable');
        }
      });
      if (localeData.locale && localeData.locale !== locale) {
        errors.localeConsistency = 'errors.localeInconsistency';
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
      errors[field] = 'errors.fieldRequired';
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
  message: 'errors.failedMatchRegex',
};

export const colloquialDateHashValidator = {
  // Colloquial Date Hash has MMDD format.
  validator: v => {
    const month = parseInt(v, 10) / 100;
    const day = parseInt(v, 10) % 100;
    return month >= 0 && month <= 12 && day >= 0 && day <= 31;
  },
  message: 'errors.failedMatchRegex',
};

export const permissionsObjectValidator = {
  validator: v => {
    if (v instanceof Array || typeof v !== 'object') {
      return false;
    }
    return Object.values(v).every(val => typeof val === 'boolean');
  },
  message: 'errors.badPermissions',
};
