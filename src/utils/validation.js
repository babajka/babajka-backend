import HttpError from 'node-http-error';
import isEmpty from 'lodash/isEmpty';

export const ValidationError = message => HttpError(400, message);

export const requireFields = (...fields) => (req, res, next) => {
  const errors = {};

  fields.forEach((field) => {
    if (!req.body[field]) {
      errors[field] = `${field} is required.`;
    }
  });

  if (!isEmpty(errors)) {
    return next(new ValidationError(errors));
  }
  return next();
};

export const checkIsFound = (object) => {
  if (!object) {
    throw (new HttpError(404));
  }

  return object;
};
