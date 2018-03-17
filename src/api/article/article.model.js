import HttpError from 'node-http-error';
import mongoose, { Schema } from 'mongoose';
import keyBy from 'lodash/keyBy';
import omit from 'lodash/omit';

import { checkPermissions } from 'api/user';

const ArticleSchema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  locales: [
    {
      type: Schema.Types.ObjectId,
      ref: 'LocalizedArticle',
    },
  ],
  collectionId: {
    type: Schema.Types.ObjectId,
    ref: 'ArticleCollection',
  },
  brand: {
    // May be e.g. 'wir' or 'kurilka'.
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'ArticleBrand',
  },
  type: {
    type: String,
    enum: ['text', 'video'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  publishAt: {
    type: Date,
    default: Date.now,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

const Article = mongoose.model('Article', ArticleSchema);

export const serializeArticle = article => ({
  ...omit(article.toObject(), ['__v']),
  locales: keyBy(article.locales, 'locale'),
});

export const checkIsPublished = (article, user) => {
  if (checkPermissions(user, ['canCreateArticle'])) {
    return article;
  }

  if (article.publishAt && new Date(article.publishAt) > Date.now()) {
    throw new HttpError(404);
  }

  return article;
};

export const POPULATE_OPTIONS = {
  author: '-_id firstName lastName email role active bio pictureURL',
  brand: '-_id slug names',
  collection: '-_id name slug description',
  locales: '-_id -__v',
};

export default Article;
