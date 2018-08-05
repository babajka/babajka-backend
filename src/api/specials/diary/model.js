import mongoose from 'mongoose';
import pick from 'lodash/pick';

import { colloquialDateHashValidator } from 'utils/validation';

const { Schema } = mongoose;

const DiarySchema = new Schema({
  locale: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  colloquialDateHash: {
    // ColloquialDateHash is a hash of date, equals to (month * 100 + day).
    // This is for diaries to be easily sorted with mongoose tools.
    type: Number,
    required: true,
    validate: colloquialDateHashValidator,
  },
  year: String,
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

DiarySchema.virtual('month').get(function get() {
  return Math.floor(parseInt(this.colloquialDateHash, 10) / 100)
    .toString(10)
    .padStart(2, '0');
});

DiarySchema.virtual('day').get(function get() {
  return Math.floor(parseInt(this.colloquialDateHash, 10) % 100)
    .toString(10)
    .padStart(2, '0');
});

DiarySchema.set('toObject', { virtuals: true });
DiarySchema.set('toJSON', { virtuals: true });

export const buildColloquialDateHash = (month, day) =>
  parseInt(month, 10) * 100 + parseInt(day, 10);

export const serializeDiary = object =>
  pick(object, ['locale', 'text', 'author', 'year', 'month', 'day']);

export const Diary = mongoose.model('Diary', DiarySchema);

export default Diary;
