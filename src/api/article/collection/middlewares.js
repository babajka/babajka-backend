export const parseLocalized = (req, res, next) => {
  try {
    if (req.body.name) {
      req.body.name = JSON.parse(req.body.name);
    }
    if (req.body.description) {
      req.body.description = JSON.parse(req.body.description);
    }
  } catch (err) {
    return next(err);
  }
  return next();
};
