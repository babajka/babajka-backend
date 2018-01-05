import { checkPermission } from 'api/user/model';

export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.sendStatus(401);
  }

  return next();
};

export const verifyPermission = permission => (req, res, next) => {
  if (!checkPermission(req.user, permission)) {
    return res.sendStatus(403);
  }

  return next();
};
