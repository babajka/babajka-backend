import { Router } from 'express';

import { requireFields, ValidationError } from 'utils/validation';
import { sendJson } from 'utils/api';
import passport, { authenticate } from './passport';
import { requireAuth, allowRoles } from './middlewares';

const router = Router();

router.post('/login', requireFields('email', 'password'),
  (req, res, next) =>
    authenticate('local-login', req, res, next)
      .then(({ id, email, role }) => sendJson(res)({ id, email, role }))
      .catch(next));

router.post('/register', requireFields('email', 'password'),
  (req, res, next) => {
    const { password } = req.body;

    if (password.length < 6) {
      return next(new ValidationError({ password: 'Пароль павінен змяшчаць хаця б 6 сімвалаў' }));
    }

    return authenticate('local-register', req, res, next)
      .then(({ id, email, role }) => sendJson(res)({ id, email, role }))
      .catch(next);
  });

router.get('/logout', requireAuth, (req, res, next) => { // eslint-disable-line no-unused-vars
  req.logOut();
  res.sendStatus(200);
});

export { passport, requireAuth, allowRoles };
export default router;
