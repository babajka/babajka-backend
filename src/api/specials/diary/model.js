import mongoose from 'mongoose';
import pick from 'lodash/pick';

import Joi, { joiToMongoose } from 'utils/joi';

const joiDiarySchema = Joi.object({
  locale: Joi.locale().required(),
  text: Joi.string().required(),
  author: Joi.string().required(),
  // ColloquialDateHash is a hash of date, equals to (month * 100 + day).
  // This is for diaries to be easily sorted with mongoose tools.
  // TODO: pass custom error message `errors.failedMatchDateHashFormat`
  colloquialDateHash: Joi.colloquialDateHash().required(),
  year: Joi.string(),
  createdAt: Joi.date().default(Date.now, 'time of creation'),
  active: Joi.boolean().default(true),
});

const DiarySchema = joiToMongoose(joiDiarySchema);

const formatDateNum = v =>
  Math.floor(v)
    .toString(10)
    .padStart(2, '0');

DiarySchema.virtual('month').get(function get() {
  return formatDateNum(this.colloquialDateHash / 100);
});

DiarySchema.virtual('day').get(function get() {
  return formatDateNum(this.colloquialDateHash % 100);
});

DiarySchema.set('toObject', { virtuals: true });
DiarySchema.set('toJSON', { virtuals: true });

export const buildColloquialDateHash = (month, day) =>
  parseInt(month, 10) * 100 + parseInt(day, 10);

export const serializeDiary = object =>
  pick(object, ['locale', 'text', 'author', 'year', 'month', 'day']);

const Diary = mongoose.model('Diary', DiarySchema);

export default Diary;
