import HttpError from 'node-http-error';
import HttpStatus from 'http-status-codes';

import mongoose from 'mongoose';
import get from 'lodash/get';
import set from 'lodash/set';
import keyBy from 'lodash/keyBy';
import omit from 'lodash/omit';

import { checkPermissions } from 'api/user';
import { VIDEO_PLATFORMS, VIDEO_PLATFORMS_LIST } from 'utils/networks';
import { ValidationError } from 'utils/validation';
import { mapIds, getId } from 'utils/getters';
import Joi, { joiToMongoose } from 'utils/joi';

const joiVideoSchema = Joi.object({
  platform: Joi.string(),
  videoId: Joi.string(),
  // Url of the video as it was put by the creator.
  videoUrl: Joi.string().uri(),
}).meta({ type: Object });

const joiArticleSchema = Joi.object({
  type: Joi.string()
    .valid(['text', 'video'])
    .required(),
  collectionId: Joi.objectId()
    .allow(null)
    .meta({ ref: 'ArticleCollection' }),

  locales: Joi.array().items(Joi.objectId().meta({ ref: 'LocalizedArticle' })),

  metadata: Joi.metadata().required(),
  // publishAt contains date and time for the article to be published.
  // Two possible values of the field are:
  // * null - makes an article a 'draft'. That means article will never be
  //    published unless the field is updated. 'null' is a default value
  //    which makes behavior safe: one must explicitly set the date in order
  //    to make article publicly discoverable.
  // * date value - specifies the date after which the article is available
  //    publicly. Must be set explicitly.
  publishAt: Joi.date()
    .allow(null)
    .default(null),
  active: Joi.boolean().default(true),
  // Images are as described in 'covers' guide by Vitalik.
  images: Joi.object().required(),
  // Can only be present when Article type is video.
  video: joiVideoSchema,
  color: Joi.color().default('#000000'),
  // Text on article card may be rendered in one of the following ways.
  // This depends on the color and is set manually.
  textColorTheme: Joi.string()
    .valid(['light', 'dark'])
    .default('light'),
  // Authors and Brands are also just Tags.
  tags: Joi.array().items(Joi.objectId().meta({ ref: 'Tag' })),
  // Keywords are for SEO optimization and search engines.
  keywords: Joi.array().items(Joi.string()),
});

const ArticleSchema = joiToMongoose(joiArticleSchema, {
  usePushEach: true,
});

// TODO: replace with joi?
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
  text: Joi.object({
    page: Joi.image(),
    horizontal: Joi.image(),
    vertical: Joi.image(),
  }),
  video: Joi.object({
    page: Joi.image(),
    horizontal: Joi.image(),
  }),
};

ArticleSchema.pre('validate', function(next) {
  const { error } = Joi.validate(this.images, IMAGES_SCHEMA[this.type].required());
  if (error !== null) {
    const errors = {};
    error.details.forEach(({ path, type }) => {
      set(errors, ['images', ...path], type);
    });

    next(new ValidationError(errors));
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
    const idx = mapIds(articles).indexOf(getId(article));

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

  throw new HttpError(HttpStatus.NOT_FOUND);
};

export const queryUnpublished = user => {
  if (!checkPermissions(user, 'canManageArticles')) {
    return { publishAt: { $lt: Date.now() } };
  }
  return {};
};

export const POPULATE_OPTIONS = {
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
