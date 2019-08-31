/* eslint-disable no-console */

import mongoose from 'mongoose';

import config from 'config';

export default (silent = false) => {
  const {
    mongodb: { url, options },
  } = config;
  mongoose.Promise = global.Promise;
  mongoose.connection.on('connected', () =>
    silent ? null : console.log(`Mongoose: connected to ${url}`)
  );
  mongoose.connection.on('error', err => console.error(`Mongoose: connection error: ${err}`));
  mongoose.connection.on('disconnected', () =>
    silent ? null : console.log('Mongoose: disconnected')
  );
  return mongoose.connect(
    url,
    {
      ...options,
      // Options below are to suppress deprecation warnings as described in
      // https://mongoosejs.com/docs/deprecations.html
      // Some deprecation warnings keep showing though (for an unknown reason).
      useNewUrlParser: true,
      useFindAndModify: false,
      // https://github.com/Automattic/mongoose/issues/2671
      // useCreateIndex: true, // - breaks `unique: true`
    },
    () => {
      if (process.env.NODE_ENV === 'testing') {
        mongoose.connection.db.dropDatabase();
        console.log('mongoose: database was dropped (testing mode is set)');
      }
    }
  );
};
