import fs from 'fs';
import { Router } from 'express';

import { isFileExist } from 'utils/io';
import { RSS_FEED_FILENAME, generateRssFeed, saveRssFeed } from './utils';

const rssFeed = async (req, res, next) => {
  res.contentType('application/rss+xml');
  const isExist = await isFileExist(RSS_FEED_FILENAME);
  if (isExist) {
    fs.createReadStream(RSS_FEED_FILENAME)
      .pipe(res)
      .on('error', next);
    return;
  }

  const rss = await generateRssFeed();
  res.send(rss);
  saveRssFeed(rss);
};

const router = Router();
router.get('/', rssFeed);
export default router;
