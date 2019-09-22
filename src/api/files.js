import { Router } from 'express';
import request from 'request';
import sharp from 'sharp';

import config from 'config';

const { host, token } = config.services.fibery;

const filesProxy = async ({ params: { secret }, query: { w, h } }, res, next) => {
  const url = `https://${host}/api/files/${secret}`;
  const options = {
    url,
    headers: { Authorization: `Token ${token}` },
  };
  const transform = sharp()
    .resize(w && +w, h && +h, {
      fit: 'outside',
      withoutEnlargement: true,
    })
    .png({ progressive: true });

  res.type(`image/png`);

  request
    .get(options)
    .on('error', next)
    .pipe(transform)
    .pipe(res);
};

const router = Router();
router.get('/:secret', filesProxy);
export default router;
