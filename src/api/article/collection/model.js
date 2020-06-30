import mongoose from 'mongoose';
import omit from 'lodash/omit';

import { serializeArticle, queryUnpublished, POPULATE_OPTIONS } from 'api/article/article.model';

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
  podcastCover: Joi.image(),
  createdAt: Joi.date().default(Date.now, 'time of creation'),
});

const ArticleCollectionSchema = joiToMongoose(joiArticleCollectionSchema, {
  usePushEach: true,
});

const ArticleCollection = mongoose.model('ArticleCollection', ArticleCollectionSchema);

export const serializeCollection = collection => ({
  ...omit(collection.toObject(), ['_id', '__v', 'fiberyId', 'fiberyPublicId']),
  articles: collection.articles.map(article =>
    serializeArticle(article, { includeCollection: false })
  ),
});

export const COLLECTION_POPULATE_OPTIONS = {
  articles: user => ({
    path: 'articles',
    select: '-metadata -fiberyId -fiberyPublicId',
    match: queryUnpublished(user),
    populate: [
      POPULATE_OPTIONS.locales,
      POPULATE_OPTIONS.tags,
      {
        // This population is to evaluate the order of articles inside of the collection.
        path: 'collectionId',
        select: '-_id slug description name cover podcastCover articles',
        populate: {
          path: 'articles',
          match: queryUnpublished(user),
          select: ['_id', 'publishAt'],
        },
      },
    ],
  }),
};

export default ArticleCollection;
