import mongoose from 'mongoose';
import omit from 'lodash/omit';

import { serializeArticle, queryUnpublished } from 'api/article/article.model';

import Joi, { joiToMongoose } from 'utils/joi';

export const joiArticleCollectionSchema = Joi.object({
  fiberyId: Joi.string()
    .meta({ unique: true })
    .required(),
  fiberyPublicId: Joi.string()
    .meta({ unique: true })
    .required(),
  name: Joi.localizedText().required(),
  description: Joi.localizedText(),
  // The order of articles below is essential and defines the structure of the collection.
  articles: Joi.array().items(Joi.objectId().meta({ ref: 'Article' })),
  slug: Joi.slug(),
  active: Joi.boolean().default(true),
  cover: Joi.image(),
  createdAt: Joi.date().default(Date.now, 'time of creation'),
});

const ArticleCollectionSchema = joiToMongoose(joiArticleCollectionSchema, {
  usePushEach: true,
});

const ArticleCollection = mongoose.model('ArticleCollection', ArticleCollectionSchema);

export const serializeCollection = collection => ({
  ...omit(collection.toObject(), ['__v']),
  articles: collection.articles.map(article =>
    serializeArticle(article, { includeCollection: false })
  ),
});

export const COLLECTION_POPULATE_OPTIONS = {
  articles: user => ({
    path: 'articles',
    match: queryUnpublished(user),
    populate: {
      path: 'locales',
    },
  }),
};

export default ArticleCollection;
