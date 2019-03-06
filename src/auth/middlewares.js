import HttpStatus from 'http-status-codes';
import { checkPermissions } from 'api/user/model';

export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.sendStatus(HttpStatus.FORBIDDEN);
  }

  return next();
};

export const verifyPermission = permission => (req, res, next) => {
  if (!checkPermissions(req.user, [permission])) {
    return res.sendStatus(HttpStatus.FORBIDDEN);
  }

  return next();
};
