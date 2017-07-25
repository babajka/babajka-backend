import { Router } from 'express';

import { requireFields, ErrorHandler, ValidationException } from 'utils/validation';
import passport, { authenticate } from './passport';

const router = Router();

router.post('/login', requireFields('email', 'password'),
  (req, res, next) => {
    const handleError = ErrorHandler(res, next);

    authenticate('local-login', req, res, next)
      .then(({ id, email, role }) => res.status(200).send({ id, email, role }))
      .catch(handleError);
  });

router.post('/register', requireFields('email', 'password'),
  (req, res, next) => {
    const handleError = ErrorHandler(res, next);
    const { password } = req.body;

    if (password.length < 6) {
      return handleError(new ValidationException({ password: 'Password must contain at least 6 characters' }));
    }

    return authenticate('local-register', req, res, next)
      .then(({ id, email, role }) => res.status(200).send({ id, email, role }))
      .catch(handleError);
  });

router.get('/logout', (req, res, next) => { // eslint-disable-line no-unused-vars
  req.logOut();
  res.sendStatus(200);
});

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.sendStatus(401);
  }

  return next();
};


export { passport, requireAuth };
export default router;
