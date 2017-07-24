import { Router } from 'express';

import passport, { authenticate } from './passport';
import { requireAuth, requireFields, ErrorHandler, AuthException } from './utils';

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
    const { password, confirmPassword } = req.body;

    if (password.length < 6) {
      return handleError(new AuthException({ password: 'Password must contain at least 6 characters' }));
    }

    if (password !== confirmPassword) {
      return handleError(new AuthException({ password: 'Passwords didn\'t match' }));
    }

    return authenticate('local-register', req, res, next)
      .then(({ id, email, role }) => res.status(200).send({ id, email, role }))
      .catch(handleError);
  });

router.get('/logout', (req, res, next) => { // eslint-disable-line no-unused-vars
  req.logout();
  res.sendStatus(200);
});

export { requireAuth, passport };
export default router;
