import fs from 'fs';
import path from 'path';
import morgan from 'morgan';

import config from 'config';

export default () => {
  const { logger } = config;
  const options = {};

  if (logger.writeToFile) {
    const logPath = path.join(__dirname, `../../${logger.fileName}`);
    console.log(`Morgan: log to ${logPath}`); // eslint-disable-line no-console
    options.stream = fs.createWriteStream(logPath, { flags: 'a' });
  }
  return morgan(logger.mode, options);
};
