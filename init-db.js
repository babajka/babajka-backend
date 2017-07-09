/* eslint-disable no-console */

import mongoose from 'mongoose';
import connectDb from './src/db';

connectDb()
  .then(() => mongoose.connection.db.dropDatabase())
  .then(() => console.log('Mongoose: drop database'))
  .then(() => process.exit())
  .catch((err) => {
    console.log('Mongoose: error during database init');
    console.error(err);
    process.exit();
  });
