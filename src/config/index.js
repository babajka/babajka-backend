import mongoose from 'mongoose';
import session from 'express-session';
import connectMongo from 'connect-mongo';
import merge from 'lodash/merge';
import fs from 'fs';

import { secretPath } from 'utils/args';
import defaultConfig from './config.json';

const MongoStore = connectMongo(session);

let secret = null;

if (secretPath) {
  try {
    secret = JSON.parse(fs.readFileSync(secretPath, 'utf8'));
  } catch (err) {
    console.error(`Failed to parse provided secret: ${err.message}. Default config will be used`);
  }
} else {
  /* eslint-disable-next-line no-console */
  console.log('No secret file provided. Default config will be used');
}

const config = secret ? merge(defaultConfig, secret) : defaultConfig;
config.port = process.env.PORT || config.port;
config.services.fibery.token = process.env.FIBERY_TOKEN || config.services.fibery.token;
config.session.store = new MongoStore({ mongooseConnection: mongoose.connection });

if (process.env.NODE_ENV === 'testing') {
  config.mongodb.url = 'mongodb://127.0.0.1/babajkatest';
}

export default config;
