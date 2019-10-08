import fs from 'fs';

import { Router } from 'express';
import request from 'request';
import gm from 'gm';

import config from 'config';
import { isFileExist } from 'utils/io';
import { imagesDir } from 'utils/args';

const { host, token } = config.services.fibery;

const filesProxy = async ({ params: { secret }, query: { w = '', f = 'png' } }, res, next) => {
  const filepath = `${imagesDir}/${secret}_${w}.${f}`;
  res.type(`image/${f}`);
  const isExist = await isFileExist(filepath);
  if (isExist) {
    fs.createReadStream(filepath)
      .pipe(res)
      .on('error', next);
    return;
  }

  // fallback to fibery
  const url = `https://${host}/api/files/${secret}`;
  const options = {
    url,
    headers: { Authorization: `Token ${token}` },
  };

  request
    .get(options)
    .on('error', next)
    .pipe(res);

  // TODO: handle 404 (now we create empty files)

  // asynchronously save file
  gm(request.get(options))
    .resize(w, null)
    // .colors(32)
    .interlace('Line') // interlaced png or progressive jpeg
    .stream(f)
    .pipe(fs.createWriteStream(filepath));
};

const router = Router();
router.get('/:secret', filesProxy);
export default router;
