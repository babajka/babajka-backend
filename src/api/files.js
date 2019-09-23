import { Router } from 'express';
import request from 'request';
import gm from 'gm';

import config from 'config';

const { host, token } = config.services.fibery;

const filesProxy = async ({ params: { secret }, query: { w = null, h = null } }, res, next) => {
  const url = `https://${host}/api/files/${secret}`;
  const options = {
    url,
    headers: { Authorization: `Token ${token}` },
  };

  res.type(`image/png`);

  gm(request.get(options))
    .resize(w, h)
    .colors(32)
    .interlace('Line') // interlaced png or progressive jpeg
    .stream()
    .pipe(res)
    .on('error', next);
};

const router = Router();
router.get('/:secret', filesProxy);
export default router;
