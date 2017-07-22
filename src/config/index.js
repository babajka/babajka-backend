import mongoose from 'mongoose';
import session from 'express-session';
import connectMongo from 'connect-mongo';
import { genSaltSync } from 'bcrypt';

import config from './config.json';

const MongoStore = connectMongo(session);

config.port = process.env.PORT || config.port;
config.session.secret = genSaltSync(config.auth.saltRounds); // is't ok?
config.session.store = new MongoStore({ mongooseConnection: mongoose.connection });
config.session.cookie.domain = `http://localhost:${config.port}`;

if (process.env.NODE_ENV === 'production') { // todo(uladbohdan): switch to prod.config.json file
  config.trustProxy = 1;
  config.session.cookie.secure = true;
  config.session.cookie.maxAge = 60 * 60 * 1000;

  config.logger.writeToFile = true;
  config.logger.mode = 'combined';
}

export default config;
