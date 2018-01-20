import mongoose from 'mongoose';

export const dropData = () => mongoose.connection.db.dropDatabase();
