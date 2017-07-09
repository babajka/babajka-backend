/* eslint-disable no-console */

import mongoose from 'mongoose';

export default function (url, options) {
  mongoose.Promise = global.Promise;
  const promise = mongoose.connect(url, options);

  mongoose.connection.on('error', err => console.log(`Mongoose: connection error: ${err}`));
  mongoose.connection.on('disconnected', () => console.log('Mongoose: connectDb disconnected'));
  mongoose.connection.on('connected', () => console.log(`Mongoose: connected to ${url}`));

  return {
    promise,
    mongoose,
  };
}
