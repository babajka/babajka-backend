import { Router } from 'express';

import passport, { authenticate, AuthException } from './passport';

const router = Router();

const ErrorHandler = (res, next) => err => (
  err instanceof AuthException ? res.send(err.message) : next(err)
);

router.post('/login', (req, res, next) => {
  const handleError = ErrorHandler(res, next);
  const { email: emailField, password } = req.body;

  if (!emailField) {
    handleError(new AuthException({ email: 'Email is required.' }));
  }

  if (!password) {
    handleError(new AuthException({ password: 'Password is required.' }));
  }

  authenticate('local-login', req, res, next)
    .then(({ id, email, role }) => res.status(200).send({ id, email, role }))
    .catch(handleError);
});

router.get('/logout', (req, res, next) => { // eslint-disable-line no-unused-vars
  req.logout();
  res.sendStatus(200);
});

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.sendStatus(401);
  }

  return next();
};

export { requireAuth, passport };
export default router;
