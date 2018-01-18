/* eslint-disable import/prefer-default-export */

import mongoose from 'mongoose';

export const dropData = () => mongoose.connection.db.dropDatabase();
