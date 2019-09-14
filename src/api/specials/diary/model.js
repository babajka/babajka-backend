import mongoose from 'mongoose';
import pick from 'lodash/pick';

import Joi, { joiToMongoose, defaultValidator } from 'utils/joi';

const joiDiarySchema = Joi.object({
  fiberyId: Joi.string()
    .meta({ unique: true })
    .required(),
  fiberyPublicId: Joi.string()
    .meta({ unique: true })
    .required(),

  locale: Joi.locale().required(),
  author: Joi.objectId().meta({ ref: 'Tag' }),
  text: Joi.object().required(),

  // ColloquialDateHash is a hash of date, equals to (month * 100 + day).
  // This is for diaries to be easily sorted with mongoose tools.
  colloquialDateHash: Joi.colloquialDateHash().required(),
  year: Joi.number(),

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

export const validateDiary = data => defaultValidator(data, joiDiarySchema);

export const buildColloquialDateHash = (month, day) =>
  parseInt(month, 10) * 100 + parseInt(day, 10);

export const serializeDiary = object =>
  pick(object, ['locale', 'text', 'author', 'year', 'month', 'day']);

export const serializeDiaries = list => list.map(serializeDiary);

const Diary = mongoose.model('Diary', DiarySchema);

export default Diary;
