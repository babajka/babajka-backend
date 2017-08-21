export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.sendStatus(401);
  }

  return next();
};

export const allowRoles = roles => (req, res, next) => {
  if (roles.indexOf(req.user.role) === -1) {
    return res.sendStatus(403);
  }

  return next();
};
