/* eslint-disable no-console */

import mongoose from 'mongoose';

import config from '../config';

export default function () {
  mongoose.Promise = global.Promise;

  mongoose.connect(config.mongodb.url, config.mongodb.options);

  mongoose.connection.on('error', err => console.log(`Mongoose: connection error: ${err}`));

  mongoose.connection.on('disconnected', () => console.log('Mongoose: connectDb disconnected'));

  mongoose.connection.on('connected', () => console.log(`Mongoose: connected to ${config.mongodb.url}`));

  return mongoose;
}
