import { Router } from 'express';

import { serializeUser } from 'api/user';
import { requireFields, ValidationError } from 'utils/validation';
import { sendJson } from 'utils/api';

import passport, { authenticate } from './passport';
import { requireAuth, verifyPermission } from './middlewares';

const router = Router();

router.post('/login', requireFields('email', 'password'), (req, res, next) =>
  authenticate('local-login', req, res, next)
    .then(user => sendJson(res)(serializeUser(user)))
    .catch(next)
);

router.post('/register', requireFields('email', 'password', 'firstName'), (req, res, next) => {
  const { password } = req.body;

  if (password.length < 7) {
    return next(new ValidationError({ password: 'Пароль павінен змяшчаць хаця б 7 сімвалаў' }));
  }

  return authenticate('local-register', req, res, next)
    .then(user => sendJson(res)(serializeUser(user)))
    .catch(next);
});

// eslint-disable-next-line no-unused-vars
router.get('/logout', requireAuth, (req, res, next) => {
  req.logOut();
  res.sendStatus(200);
});

export { passport, requireAuth, verifyPermission };
export default router;
