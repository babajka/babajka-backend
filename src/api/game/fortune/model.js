import mongoose from 'mongoose';

import Joi, { joiToMongoose } from 'utils/joi';

const joiFortuneCookieSchema = Joi.object({
  fiberyId: Joi.string()
    .meta({ unique: true })
    .required(),
  fiberyPublicId: Joi.string()
    .meta({ unique: true })
    .required(),

  author: Joi.string(),
  text: Joi.object().required(),
});

export const formatFortuneCookie = ({ author, text }) => ({ author, text });

const joiFortuneGameSchema = Joi.object({
  fiberyId: Joi.string()
    .meta({ unique: true })
    .required(),
  fiberyPublicId: Joi.string()
    .meta({ unique: true })
    .required(),

  slug: Joi.string()
    .meta({ unique: true })
    .required(),
  description: Joi.object().required(),

  cookies: Joi.array().items(joiFortuneCookieSchema),

  suggestedArticles: Joi.object().allow(null),
});

const FortuneGameSchema = joiToMongoose(joiFortuneGameSchema);

const FortuneGame = mongoose.model('FortuneGame', FortuneGameSchema);

export const formatFortuneGame = ({ description, slug, suggestedArticles }) => ({
  description,
  slug,
  suggestedArticles,
});

export default FortuneGame;
