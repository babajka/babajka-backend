import { checkPermissions } from 'api/user/model';

export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.sendStatus(403);
  }

  return next();
};

export const verifyPermission = permission => (req, res, next) => {
  if (!checkPermissions(req.user, [permission])) {
    return res.sendStatus(403);
  }

  return next();
};
