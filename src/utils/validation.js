import HttpError from 'node-http-error';
import isEmpty from 'lodash/isEmpty';
import mongoose from 'mongoose';

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
