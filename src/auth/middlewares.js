import { checkRoles } from 'api/user/model';

export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.sendStatus(401);
  }

  return next();
};

export const allowRoles = roles => (req, res, next) => {
  if (!checkRoles(req.user, roles)) {
    return res.sendStatus(403);
  }

  return next();
};
