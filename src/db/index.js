/* eslint-disable no-console */

import mongoose from 'mongoose';
import config from 'config';

export default (silent = false) => {
  const { mongodb: { url, options } } = config;
  mongoose.Promise = global.Promise;
  mongoose.connection.on('connected', () => (silent ? null : console.log(`Mongoose: connected to ${url}`)));
  mongoose.connection.on('error', err => console.error(`Mongoose: connection error: ${err}`));
  mongoose.connection.on('disconnected', () => (silent ? null : console.log('Mongoose: disconnected')));
  return mongoose.connect(url, options);
};
