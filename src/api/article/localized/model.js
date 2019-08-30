import mongoose from 'mongoose';

import Joi, { joiToMongoose } from 'utils/joi';

const joiLocalizedArticleSchema = Joi.object({
  articleId: Joi.objectId().required(),
  locale: Joi.locale().required(),
  title: Joi.string().required(),
  subtitle: Joi.string().required(),
  content: Joi.object(),
  slug: Joi.slug()
    .meta({ unique: true })
    .required(),
  metadata: Joi.metadata().required(),
  active: Joi.boolean().default(true),
  // Keywords are for SEO optimization and search engines.
  keywords: Joi.array().items(Joi.string()),
});

const LocalizedArticleSchema = joiToMongoose(joiLocalizedArticleSchema, {
  usePushEach: true,
  minimize: false,
});

const LocalizedArticle = mongoose.model('LocalizedArticle', LocalizedArticleSchema);

export default LocalizedArticle;
