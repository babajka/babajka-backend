import mongoose from 'mongoose';
import session from 'express-session';
import connectMongo from 'connect-mongo';
import merge from 'lodash/merge';
import fs from 'fs';
import path from 'path';

import defaultConfig from './config.json';

const MongoStore = connectMongo(session);
const secretPath = process.argv[2] || path.join(__dirname, 'secret.json');
let secret = null;

try {
  secret = JSON.parse(fs.readFileSync(secretPath, 'utf8'));
} catch (err) {
  console.error(`Error: ${err.message}. Used default configs as secret`);
}

const config = secret ? merge(defaultConfig, secret) : defaultConfig;
config.port = process.env.PORT || config.port;
config.session.store = new MongoStore({ mongooseConnection: mongoose.connection });

if (process.env.NODE_ENV === 'testing') {
  config.mongodb.url = 'mongodb://127.0.0.1/babajkatest';
}

export default config;
