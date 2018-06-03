import HttpError from 'node-http-error';
import mongoose, { Schema } from 'mongoose';
import keyBy from 'lodash/keyBy';
import omit from 'lodash/omit';

import { checkPermissions } from 'api/user';

const ArticleSchema = new Schema(
  {
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
    imageUrl: {
      type: String,
      required: true,
    },
    // This is a YouTube video ID. Ignored unless Article type is video.
    videoId: String,
  },
  {
    usePushEach: true,
  }
);

const Article = mongoose.model('Article', ArticleSchema);

// includeCollection flag here is to be able to avoid including collections
// in case we're serializing an article into the ArticleCollection object..
export const serializeArticle = (article, includeCollection = true) => {
  const collectionNavigation = {};
  if (includeCollection && article.collectionId) {
    collectionNavigation.collectionPrev = null;
    collectionNavigation.collectionNext = null;

    const { articles } = article.collectionId;
    const idx = articles.map(a => a._id.toString()).indexOf(article._id.toString());

    if (idx > 0) {
      const a = articles[idx - 1].toObject();
      collectionNavigation.collectionPrev = {
        ...omit(a, ['locales']),
        locales: keyBy(a.locales, 'locale'),
      };
    }

    if (idx !== articles.length - 1) {
      const a = articles[idx + 1].toObject();
      collectionNavigation.collectionNext = {
        ...omit(a, ['locales']),
        locales: keyBy(a.locales, 'locale'),
      };
    }
  }
  return {
    ...omit(article.toObject(), ['__v', 'collectionId']),
    collection: includeCollection
      ? article.collectionId && omit(article.collectionId.toObject(), ['articles'])
      : undefined,
    ...collectionNavigation,
    locales: keyBy(article.locales, 'locale'),
  };
};

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
  // TODO(uladbohdan): to merge with User basicFields.
  author: '-_id firstName lastName email role active bio imageUrl displayName',
  brand: '-_id slug names imageUrl imageUrlSmall',
  collection: publishedOnly => ({
    path: 'collectionId',
    select: '-_id name slug description imageUrl articles',
    populate: {
      path: 'articles',
      match: publishedOnly ? { publishAt: { $lt: Date.now() } } : undefined,
      select: ['_id'],
      populate: { path: 'locales', select: ['title', 'subtitle', 'slug', 'locale'] },
    },
  }),
  locales: '-_id -__v',
};

export default Article;
