import { Router } from 'express';
import request from 'request';

import config from 'config';

const { host, token } = config.services.fibery;

const filesProxy = async ({ params: { secret } }, res, next) => {
  const url = `https://${host}/api/files/${secret}`;
  const options = {
    url,
    headers: { Authorization: `Token ${token}` },
    encoding: 'binary',
  };
  request
    .get(options)
    .on('error', next)
    .pipe(res);
};

const router = Router();
router.get('/:secret', filesProxy);
export default router;
