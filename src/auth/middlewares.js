import HttpStatus from 'http-status-codes';

import { checkPermissions } from 'api/user/model';

import { authenticate } from './passport';

export const requireAuth = (req, res, next) => {
  if (req.user) {
    // User was already restored from a session.
    return next();
  }

  const jwtAuth = authenticate('jwt', { session: false });

  // Attempt to alternatively login with jwt token.
  return jwtAuth(req, res, next)
    .then(user => {
      req.user = user;
    })
    .then(next)
    .catch(() => {
      res.sendStatus(HttpStatus.FORBIDDEN);
    });
};

export const verifyPermission = permission => (req, res, next) => {
  if (!checkPermissions(req.user, [permission])) {
    return res.sendStatus(HttpStatus.FORBIDDEN);
  }

  return next();
};
