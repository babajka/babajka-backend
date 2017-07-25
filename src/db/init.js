/* eslint-disable no-console */

import mongoose from 'mongoose';

import connectDb from 'db';
import { User } from 'api/user';
import usersData from './users.json';

const initUsers = () => Promise.all(usersData.map(async (userData) => {
  const user = new User(userData);
  await user.setPassword(userData.password);
  return user.save();
}));

(async () => {
  try {
    await connectDb();
    await mongoose.connection.db.dropDatabase();
    console.log('Mongoose: drop database');

    await initUsers();
    const users = await User.find({});
    console.log(`Mongoose: insert ${users.length} users`);
  } catch (err) {
    console.log('Mongoose: error during database init');
    console.error(err);
    process.exit();
  }
  process.exit();
})();
