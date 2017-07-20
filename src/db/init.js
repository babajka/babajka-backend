/* eslint-disable no-console */

import mongoose from 'mongoose';
import connectDb from './index';

(async () => {
  try {
    await connectDb();
    await mongoose.connection.db.dropDatabase();
    console.log('Mongoose: drop database');
  } catch (err) {
    console.log('Mongoose: error during database init');
    console.error(err);
    process.exit();
  }
  process.exit();
})();
