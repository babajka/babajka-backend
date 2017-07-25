import isEmpty from 'lodash/isEmpty';

export function ValidationException(message) {
  this.message = message;
}

export const ErrorHandler = (res, next) => err => (
  err instanceof ValidationException ? res.status(400).send(err.message) : next(err)
);

export const requireFields = (...fields) => (req, res, next) => {
  const handleError = ErrorHandler(res, next);
  const errors = {};

  fields.forEach((field) => {
    if (!req.body[field]) {
      errors[field] = `${field} is required.`;
    }
  });

  if (!isEmpty(errors)) {
    return handleError(new ValidationException(errors));
  }
  return next();
};
