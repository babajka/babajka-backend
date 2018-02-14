import HttpError from 'node-http-error';
import isEmpty from 'lodash/isEmpty';

export const ValidationError = message => HttpError(400, message);

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

export const slugValidator = {
  validator: v => /^[a-zA-Z0-9_-]+$/.test(v),
  message: 'failed to match regexp',
};

export const colloquialDateValidator = {
  // Colloquial Date has MM-DD format.
  validator: v => /\d{2}-\d{2}/.test(v),
  message: 'failed to match regexp',
};
