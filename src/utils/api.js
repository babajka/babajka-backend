import md5 from 'md5';

export const sendJson = (res, status = 200) => data => res.status(status).json(data);

export const getMD5Hash = string => md5(string);
