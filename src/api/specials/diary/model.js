import mongoose, { Schema } from 'mongoose';

import { colloquialDateValidator } from 'utils/validation';

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
  colloquialDate: {
    type: String,
    required: true,
    validate: colloquialDateValidator,
  },
  year: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

export const Diary = mongoose.model('Diary', DiarySchema);

export default Diary;
