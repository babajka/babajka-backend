import HttpError from 'node-http-error';
import mongoose, { Schema } from 'mongoose';
import omit from 'lodash/omit';

import { checkPermission } from 'api/user';

const ArticleSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    required: true,
  },
  video: String,
  image: String,
  text: Schema.Types.Mixed,
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  tags: [String],
  collectionId: {
    type: Schema.Types.ObjectId,
    // TODO: add reference to ArticleCollection
  },
  brand: {
    // May be 'Wir' or 'Kurilka'.
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'ArticleBrand',
  },
  type: {
    // May be 'text' or 'video'.
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  publishAt: {
    type: Date,
    default: Date.now,
  },
});

const Article = mongoose.model('Article', ArticleSchema);

export const serializeArticle = article => ({
  ...omit(article.toObject(), ['_id', '__v']),
  brand: article.brand.name,
});

export const checkIsPublished = (article, user) => {
  if (checkPermission(user, 'canCreateArticle')) {
    return article;
  }

  if (article.publishAt && new Date(article.publishAt) > Date.now()) {
    throw new HttpError(404);
  }

  return article;
};

export default Article;
