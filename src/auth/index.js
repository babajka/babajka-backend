import { Router } from 'express';

import { serializeUser } from 'api/user';
import { requireFields, validatePassword } from 'utils/validation';
import { sendJson } from 'utils/api';

import passport, { social, local } from './passport';
import { requireAuth, verifyPermission } from './middlewares';

const router = Router();

router.post('/login', requireFields('email', 'password'), (req, res, next) =>
  local
    .login(req, res, next)
    .then(user => sendJson(res)({ user: serializeUser(user) }))
    .catch(next)
);

router.post('/register', requireFields('email', 'password', 'firstName'), (req, res, next) => {
  const { password } = req.body;

  validatePassword(password);

  return local
    .register(req, res, next)
    .then(user => sendJson(res)(serializeUser(user)))
    .catch(next);
});

router.get('/google', social.google.authenticate);
router.get('/google/callback', social.google.callback, (req, res) => res.redirect('/'));

// eslint-disable-next-line no-unused-vars
router.get('/logout', requireAuth, (req, res, next) => {
  req.logOut();
  res.sendStatus(200);
});

export { passport, requireAuth, verifyPermission };
export default router;
