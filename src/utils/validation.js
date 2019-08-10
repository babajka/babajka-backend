import HttpError from 'node-http-error';
import HttpStatus from 'http-status-codes';

import isEmpty from 'lodash/isEmpty';
import set from 'lodash/set';
import mongoose from 'mongoose';
import Joi from 'joi';

import { joiMainPageDataSchema, joiSidebarDataSchema } from 'constants/storage';

export function ValidationError(message) {
  return HttpError(HttpStatus.BAD_REQUEST, message);
}

export const validatePassword = password => {
  if (password.length < 7) {
    throw new ValidationError({ password: 'auth.badPassword' });
  }
};

const checkForbiddenFields = body => {
  const errors = {};

  ['author', 'authorEmail', 'brand', 'brandSlug', 'collection'].forEach(field => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      errors[field] = 'frontend is forbidden to send this field to backend';
    }
  });

  return errors;
};

const createArticleValidator = ({ body }, res, next) => {
  const errors = checkForbiddenFields(body);

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
  const errors = checkForbiddenFields(body);

  ['type', 'images'].forEach(field => {
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

export const checkMainPageEntitiesFormat = data =>
  Joi.validate(data, joiMainPageDataSchema).error === null;

const setMainPageValidator = ({ body }, res, next) => {
  const valid = checkMainPageEntitiesFormat(body.data);
  return next(!valid && new ValidationError({ mainPageEntities: 'not valid' }));
};

const checkSidebarEntitiesFormat = data => Joi.validate(data, joiSidebarDataSchema).error === null;

const setSidebarValidator = ({ body }, res, next) => {
  const valid = checkSidebarEntitiesFormat(body.data);
  return next(!valid && new ValidationError({ sidebarEntities: 'not valid' }));
};

const mailRequestValidator = ({ body }, res, next) => {
  const errors = {};
  const validUserStatuses = ['subscribed', 'unsubscribed'];
  const validLanguages = ['be', 'ru', 'en'];

  const validators = {
    emailAddress: emailAddress => emailAddress,
    userStatus: status => validUserStatuses.includes(status),
    language: language => body.userStatus === 'unsubscribed' || validLanguages.includes(language),
  };

  Object.keys(validators).forEach(field => {
    if (!validators[field](body[field])) {
      errors[field] = `value '${body[field]}' is not valid.`;
    }
  });

  const valid = Object.keys(errors).length === 0;
  return next(
    !valid &&
      new ValidationError({
        mailRequest: errors,
      })
  );
};

export const precheck = {
  createArticle: createArticleValidator,
  updateArticle: updateArticleValidator,
  setMainPage: setMainPageValidator,
  setSidebar: setSidebarValidator,
  mailRequest: mailRequestValidator,
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

export const checkIsFound = (object, code = HttpStatus.NOT_FOUND) => {
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
    const month = Math.floor(parseInt(v, 10) / 100);
    const day = Math.floor(parseInt(v, 10) % 100);
    return month >= 0 && month <= 12 && day >= 0 && day <= 31;
  },
  message: 'errors.failedMatchDateHashFormat',
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

// TODO: replace with `joiSchemas.color`
export const colorValidator = {
  validator: v => /^[0-9a-fA-F]{6}$/.test(v),
  message: 'errors.failedMatchRegex',
};
