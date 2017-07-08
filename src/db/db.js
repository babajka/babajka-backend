/* eslint-disable no-console */

import mongoose from 'mongoose';

import config from '../config';

export default function () {
  mongoose.connect(config.mongodb.url, {
    useMongoClient: true
  });

  mongoose.connection.on('connected', () => {
    console.log(`Mongoose: connected to ${config.mongodb.url}`);
  });

  mongoose.connection.on('error', (err) => {
    console.log(`Mongoose: connection error: ${err}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('Mongoose: connection disconnected');
  });

  return mongoose;
}
