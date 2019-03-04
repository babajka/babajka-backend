import HttpError from 'node-http-error';
import Joi from 'joi';
import mongoose from 'mongoose';
import get from 'lodash/get';
import set from 'lodash/set';
import keyBy from 'lodash/keyBy';
import omit from 'lodash/omit';

import { checkPermissions } from 'api/user';
import { VIDEO_PLATFORMS, VIDEO_PLATFORMS_LIST } from 'utils/networks';
import { ValidationError, colorValidator } from 'utils/validation';
import { ObjectMetadata } from 'api/helpers/metadata';

const { Schema } = mongoose;

const VideoReferenceSchema = new Schema({
  platform: {
    type: String,
  },
  videoId: {
    type: String,
  },
  videoUrl: {
    // Url of the video as it was put by the author/admin.
    type: String,
  },
});

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
    metadata: {
      type: ObjectMetadata.schema,
      required: true,
    },
    publishAt: {
      // publishAt contains date and time for the article to be published.
      // Two possible values of the field are:
      // * null - makes an article a 'draft'. That means article will never be
      //    published unless the field is updated. 'null' is a default value
      //    which makes behavior safe: one must explicitly set the date in order
      //    to make article publicly discoverable.
      // * date value - specifies the date after which the article is available
      //    publicly. Must be set explicitly.
      type: Date,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
    images: {
      // Images are as described in 'covers' guide by Vitalik.
      type: Schema.Types.Mixed,
      required: true,
    },
    video: {
      // Can only be present when Article type is video.
      type: VideoReferenceSchema,
    },
    color: {
      // Articles have colors to be rendered on the main page.
      type: String,
      validate: colorValidator,
      required: true,
      default: '000000',
    },
    textColorTheme: {
      // Text on article card may be rendered in one of the following ways.
      // This depends on the color and is set manually.
      type: String,
      required: true,
      enum: ['light', 'dark'],
      default: 'light',
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],
  },
  {
    usePushEach: true,
  }
);

ArticleSchema.pre('validate', function(next) {
  if (this.type === 'video') {
    ['video.platform', 'video.videoId'].forEach(path => {
      if (!get(this, path)) {
        next(new ValidationError(`Missing ${path} field for Video Article type`));
      }
    });
    if (!VIDEO_PLATFORMS_LIST.includes(this.video.platform)) {
      next(new ValidationError('video platform is not supported'));
    }
    if (!VIDEO_PLATFORMS[this.video.platform](this.video.videoId)) {
      next(new ValidationError('bad videoId for selected platform'));
    }
  }
  if (this.type === 'text' && this.video) {
    next(new ValidationError('video must be absent if article type is text'));
  }
  next();
});

const IMAGES_SCHEMA = {
  text: Joi.object().keys({
    page: Joi.string().required(),
    horizontal: Joi.string().required(),
    vertical: Joi.string().required(),
  }),
  video: Joi.object().keys({
    page: Joi.string().required(),
    horizontal: Joi.string().required(),
  }),
};

ArticleSchema.pre('validate', function(next) {
  const { error } = Joi.validate(this.images, IMAGES_SCHEMA[this.type]);
  if (error !== null) {
    const errors = {};
    error.details.forEach(({ path, type }) => {
      set(errors, ['images', ...path], type);
    });

    next(new ValidationError({ errors }));
  }
  next();
});

// includeCollection flag here is to be able to avoid including collections
// in case we're serializing an article into the ArticleCollection object..
export const serializeArticle = (article, { includeCollection = true } = {}) => {
  const collectionNavigation = {};

  if (includeCollection && article.collectionId) {
    collectionNavigation.prev = null;
    collectionNavigation.next = null;

    const { articles } = article.collectionId;
    const idx = articles.map(a => a._id.toString()).indexOf(article._id.toString());

    if (idx > 0) {
      const a = articles[idx - 1].toObject();
      collectionNavigation.prev = {
        ...omit(a, ['locales']),
        locales: keyBy(a.locales, 'locale'),
      };
    }

    if (idx !== articles.length - 1) {
      const a = articles[idx + 1].toObject();
      collectionNavigation.next = {
        ...omit(a, ['locales']),
        locales: keyBy(a.locales, 'locale'),
      };
    }
  }

  const result = {
    ...omit(article.toObject(), [
      '__v',
      'collectionId',
      'video._id',
      'metadata._id',
      'metadata.createdBy._id',
      'metadata.createdBy.displayName',
      'metadata.updatedBy._id',
      'metadata.updatedBy.displayName',
    ]),
    locales: keyBy(article.locales, 'locale'),
  };

  if (includeCollection) {
    result.collection = article.collectionId && {
      ...omit(article.collectionId.toObject(), ['articles']),
      ...collectionNavigation,
    };
  }

  return result;
};

export const checkIsPublished = (article, user) => {
  if (article.publishAt && new Date(article.publishAt) < Date.now()) {
    // Article is already published for everybody.
    return article;
  }
  if (checkPermissions(user, 'canManageArticles')) {
    // canManageArticles permissions gives access to all articles including drafts.
    return article;
  }

  // TODO(uladbohdan): to uncomment following code in order to make unpublished
  // article discoverable by their authors. This can be done once users with
  // role 'author' are allowed to login.
  // if (checkPermissions(user, 'canCreateArticle') && article.author === user._id) {
  //   return article;
  // }

  throw new HttpError(404);
};

export const queryUnpublished = user => {
  if (!checkPermissions(user, 'canManageArticles')) {
    return { publishAt: { $lt: Date.now() } };

    // TODO(uladbohdan): to uncomment following code in order to make unpublished
    // article discoverable by their authors. This can be done once users with
    // role 'author' are allowed to login.
    // return checkPermissions(user, 'canCreateArticle')
    //   ? { $or: [{ publishAt: { $lt: Date.now() } }, { author: user._id }] }
    //   : { publishAt: { $lt: Date.now() } };
  }
  return {};
};

export const POPULATE_OPTIONS = {
  // TODO(uladbohdan): to merge with User basicFields.
  author: '-_id firstName lastName email role active bio imageUrl displayName',
  brand: '-_id slug names imageUrl imageUrlSmall',
  collection: user => ({
    path: 'collectionId',
    select: '-_id name slug description imageUrl articles',
    populate: {
      path: 'articles',
      match: queryUnpublished(user),
      select: ['_id'],
      populate: { path: 'locales', select: ['title', 'subtitle', 'slug', 'locale'] },
    },
  }),
  locales: {
    path: 'locales',
    select: '-_id -__v',
    populate: [
      { path: 'metadata.createdBy', select: 'email' },
      { path: 'metadata.updatedBy', select: 'email' },
    ],
  },
  metadata: [
    { path: 'metadata.updatedBy', select: 'email' },
    { path: 'metadata.createdBy', select: 'email' },
  ],
  tags: {
    path: 'tags',
    select: '-__v -metadata',
    populate: {
      path: 'topic',
      select: 'slug',
    },
  },
};

export const DEFAULT_ARTICLE_QUERY = user => ({
  $and: [
    {
      active: true,
      locales: { $exists: true },
    },
    queryUnpublished(user),
  ],
});

ArticleSchema.statics.customQuery = function({ query = {}, user, sort, skip, limit } = {}) {
  return this.find(query)
    .populate('author', POPULATE_OPTIONS.author)
    .populate('brand', POPULATE_OPTIONS.brand)
    .populate(POPULATE_OPTIONS.collection(user))
    .populate(POPULATE_OPTIONS.locales)
    .populate(POPULATE_OPTIONS.metadata)
    .populate(POPULATE_OPTIONS.tags)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .then(articles => articles.map(serializeArticle));
};

const Article = mongoose.model('Article', ArticleSchema);

export default Article;
