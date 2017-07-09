/* eslint-disable no-console */

import mongoose from 'mongoose';
import config from '../config';

export default () => {
  const { mongodb: { url, options } } = config;
  mongoose.Promise = global.Promise;
  mongoose.connection.on('connected', () => console.log(`Mongoose: connected to ${url}`));
  mongoose.connection.on('error', err => console.error(`Mongoose: connection error: ${err}`));
  mongoose.connection.on('disconnected', () => console.log('Mongoose: disconnected'));
  return mongoose.connect(url, options);
};
