import parse from 'http-range-parse';

export const parseRange = (req, res, next) => {
  if (req.headers.range) {
    const { first = 0, last = 10, unit = 'items' } = parse(req.headers.range);
    const skip = first;
    // A limit() value of 0 is equivalent to setting no limit.
    const limit = Math.max(last - first, 0);

    const range = { unit, first, last, skip, limit };
    req.range = range;
    res.range = range;
  }
  return next();
};
