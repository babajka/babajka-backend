import md5 from 'md5';
import HttpStatus from 'http-status-codes';
import format from 'http-content-range-format';

export const sendJson = (res, { status = HttpStatus.OK, range } = {}) => data => {
  if (range) {
    const responseRange = { ...res.range, ...range };
    res.setHeader('Content-Range', format(responseRange));
  }
  return res.status(status).json(data);
};

export const getMD5Hash = string => md5(string);
