import mongoose from 'mongoose';
import session from 'express-session';
import connectMongo from 'connect-mongo';
import { genSaltSync } from 'bcrypt';

const config = require('./config.json');

const secret = require(process.env.BABAJKA_SECRET || './secret.json' || './config.json');

// Replacing config.json defaults with secret values, if possible.
// Note that secret.json file must repeat config.json file structure.
Object.assign(config, secret);

const MongoStore = connectMongo(session);

config.port = process.env.PORT || config.port;
config.session.secret = genSaltSync(config.auth.saltRounds); // is't ok?
config.session.store = new MongoStore({ mongooseConnection: mongoose.connection });
config.session.cookie.domain = `http://localhost:${config.port}`;

if (process.env.NODE_ENV === 'production') {
  // TODO(uladbohdan): to move the values into a secret-prod.json file.
  config.trustProxy = 1;
  config.session.cookie.secure = true;
  config.session.cookie.maxAge = 60 * 60 * 1000;

  config.logger.writeToFile = true;
  config.logger.mode = 'combined';
}

export default config;
