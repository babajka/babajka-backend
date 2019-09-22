import { Router } from 'express';
import fetch from 'node-fetch';
import imagemin from 'imagemin';
import imageminPngquant from 'imagemin-pngquant';

import config from 'config';

const { host, token } = config.services.fibery;

const filesProxy = async ({ params: { secret } }, res, next) => {
  const url = `https://${host}/api/files/${secret}`;
  const options = {
    headers: { Authorization: `Token ${token}` },
  };

  try {
    // slow & without streams 👎
    const file = await fetch(url, options).then(r => r.buffer());
    const result = await imagemin.buffer(file, {
      plugins: [imageminPngquant()],
    });

    res.type('image/png');
    res.send(result);
  } catch (err) {
    next(err);
  }
};

const router = Router();
router.get('/:secret', filesProxy);
export default router;
