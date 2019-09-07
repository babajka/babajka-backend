import mongoose from 'mongoose';

import Joi, { joiToMongoose } from 'utils/joi';

export const joiLocalizedArticleSchema = Joi.object({
  articleId: Joi.objectId().required(),
  locale: Joi.locale().required(),
  title: Joi.string().required(),
  subtitle: Joi.string().required(),
  text: Joi.object().required(),
  slug: Joi.slug(),
  metadata: Joi.metadata().required(),
  active: Joi.boolean().default(true),
});

const LocalizedArticleSchema = joiToMongoose(joiLocalizedArticleSchema, {
  usePushEach: true,
  minimize: false,
});

const LocalizedArticle = mongoose.model('LocalizedArticle', LocalizedArticleSchema);

export default LocalizedArticle;
