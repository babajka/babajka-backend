import mongoose from 'mongoose';

import Joi, { joiToMongoose } from 'utils/joi';

const joiFortuneCookieSchema = Joi.object({
  fiberyId: Joi.string()
    .meta({ unique: true })
    .required(),
  fiberyPublicId: Joi.string()
    .meta({ unique: true })
    .required(),

  author: Joi.string().allow(null),
  authorTag: Joi.objectId()
    .meta({ ref: 'Tag' })
    .allow(null),

  text: Joi.object().required(),
});

export const POPULATE_AUTHOR_TAG = {
  path: 'cookies',
  populate: {
    path: 'authorTag',
    select: '-_id -__v -metadata -fiberyId -fiberyPublicId',
    populate: {
      path: 'topic',
      select: '-_id slug',
    },
  },
};

export const formatFortuneCookie = ({ author, authorTag, text }) => ({ author, authorTag, text });

const joiFortuneGameSchema = Joi.object({
  fiberyId: Joi.string()
    .meta({ unique: true })
    .required(),
  fiberyPublicId: Joi.string()
    .meta({ unique: true })
    .required(),

  title: Joi.string().required(),
  description: Joi.object().required(),
  slug: Joi.string()
    .meta({ unique: true })
    .required(),

  cookies: Joi.array().items(joiFortuneCookieSchema),

  suggestedArticles: Joi.object().allow(null),
});

const FortuneGameSchema = joiToMongoose(joiFortuneGameSchema);

const FortuneGame = mongoose.model('FortuneGame', FortuneGameSchema);

export const formatFortuneGame = ({ title, description, slug, suggestedArticles }) => ({
  title,
  description,
  slug,
  suggestedArticles,
});

export default FortuneGame;
