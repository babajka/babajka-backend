import fs from 'fs';

import { Router } from 'express';
import request from 'request';
import gm from 'gm';

import { isFileExist } from 'utils/io';
import { imagesDir } from 'utils/args';

import { getFilesHeaders } from './utils';

const filesProxy = async (
  { params: { secret }, query: { w = '', h = '', f = 'png', mode = '' } },
  res,
  next
) => {
  const filepath =
    mode === 'raw'
      ? // On mode 'raw' we do not attempt to resize an image and are using an exact copy of the one uploaded to Fibery.
        `${imagesDir}/${secret}_raw.${f}`
      : `${imagesDir}/${secret}_${w}x${h}.${f}`;
  res.type(`image/${f}`);
  const isExist = await isFileExist(filepath);
  if (isExist) {
    fs.createReadStream(filepath)
      .pipe(res)
      .on('error', next);
    return;
  }

  // fallback to fibery
  const options = getFilesHeaders(secret);
  request
    .get(options)
    .on('error', next)
    .pipe(res);

  // asynchronously save file
  const imageReq = request.get(options).on('response', imageRes => {
    if (imageRes.statusCode !== 200) {
      console.error(`[filesProxy]: ${secret} ${imageRes.statusCode} ${imageRes.statusMessage}`);
      return;
    }
    if (mode === 'raw') {
      imageReq.pipe(fs.createWriteStream(filepath));
      return;
    }
    gm(imageReq)
      .resize(w, h)
      // .colors(32)
      .interlace('Line') // interlaced png or progressive jpeg
      .stream(f)
      .pipe(fs.createWriteStream(filepath));
  });
};

const router = Router();
router.get('/:secret', filesProxy);
export default router;
