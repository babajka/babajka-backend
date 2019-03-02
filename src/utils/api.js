import md5 from 'md5';
import HttpStatus from 'http-status-codes';

export const sendJson = (res, status = HttpStatus.OK) => data => res.status(status).json(data);

export const getMD5Hash = string => md5(string);
