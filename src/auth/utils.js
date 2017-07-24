import isEmpty from 'lodash/isEmpty';

export function AuthException(message) {
  this.message = message;
}

export const ErrorHandler = (res, next) => err => (
  err instanceof AuthException ? res.status(400).send(err.message) : next(err)
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
    return handleError(new AuthException(errors));
  }
  return next();
};

export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.sendStatus(401);
  }

  return next();
};
