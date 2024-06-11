import HttpError from 'node-http-error';
import HttpStatus from 'http-status-codes';

import mongoose from 'mongoose';
import keyBy from 'lodash/keyBy';
import omit from 'lodash/omit';
import set from 'lodash/set';

import { checkPermissions } from 'api/user';
import { mapIds, getId } from 'utils/getters';
import Joi, { joiToMongoose, defaultValidator } from 'utils/joi';

import { populateStateData, STATE_ENTITIES_QUERIES } from 'api/storage/controller';

import ContentAnalytics from './analytics/model';

const joiArticleSchema = Joi.object({
  fiberyId: Joi.string()
    .meta({ unique: true })
    .required(),
  fiberyPublicId: Joi.string()
    .meta({ unique: true })
    .required(),
  type: Joi.string()
    .valid(['text', 'video', 'audio'])
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
  video: Joi.object({
    platform: Joi.string().valid(['youtube']),
    id: Joi.string().regex(/^[a-zA-Z0-9_-]{11}$/),
    url: Joi.string().uri(),
  }).allow(null),
  audio: Joi.object({
    platform: Joi.string().valid(['soundcloud', 'yandex']),
    id: Joi.string().regex(/^\d+$/),
    episodeIds: Joi.object({
      applepodcasts: Joi.string(),
      spotifypodcasts: Joi.string(),
      yandexmusic: Joi.string(),
      youtubepodcasts: Joi.string(),
    }),
    url: Joi.string().uri(),
    source: Joi.string(),
    mimeType: Joi.string(),
    duration: Joi.number(),
    size: Joi.number(),
  }).allow(null),
  color: Joi.color(),
  // Text on article card may be rendered in one of the following ways.
  // This depends on the color and is set manually.
  theme: Joi.theme(),
  // Authors and Brands are also just Tags.
  tags: Joi.array().items(Joi.objectId().meta({ ref: 'Tag' })),
  // Keywords are for SEO optimization and search engines.
  keywords: Joi.string(),
  // The main page state blocks for suggested articles.
  suggestedArticles: Joi.object().allow(null),
});
// FIXME: falls with { audio: null, video: null }
// .nand('video', 'audio');

const COVER_FORMATS = ['page', 'horizontal', 'vertical', 'podcast'];

const getImagesSchema = () =>
  Joi.object(
    COVER_FORMATS.reduce((acc, cur) => {
      acc[cur] = Joi.image();
      return acc;
    }, {})
  );

export const validateArticle = data => {
  const schema = joiArticleSchema.keys({
    images: getImagesSchema().required(),
    // TODO: conditional require `video` or `audio`
  });
  return defaultValidator(data, schema);
};

const ArticleSchema = joiToMongoose(joiArticleSchema, { usePushEach: true }, validateArticle);

const formatArticle = (article, { keepSuggestions = false } = {}) =>
  article
    ? {
        ...omit(article.toObject(), [
          '__v',
          'collectionId',
          'video._id',
          'metadata._id',
          'metadata.createdBy._id',
          'metadata.createdBy.displayName',
          'metadata.updatedBy._id',
          'metadata.updatedBy.displayName',
          !keepSuggestions && 'suggestedArticles',
        ]),
        locales: keyBy(article.locales, 'locale'),
      }
    : null;

// includeCollection flag here is to be able to avoid including collections
// in case we're serializing an article into the ArticleCollection object.
export const serializeArticle = (
  article,
  { includeCollection = true, keepSuggestions = false } = {}
) => {
  const result = formatArticle(article, { keepSuggestions });

  if (!article.collectionId) {
    return result;
  }

  const { articles } = article.collectionId;
  const sortedArticles = articles.sort((a, b) => a.publishAt - b.publishAt);
  const articleIndex = mapIds(sortedArticles).indexOf(getId(article));
  result.collection = {
    ...omit(article.collectionId.toObject(), ['articles']),
    articleIndex,
  };
  if (includeCollection) {
    result.collection.articles = sortedArticles.map(a => formatArticle(a, { keepSuggestions }));
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
    // FIXME: publishAt check
    // return { publishAt: { $lt: Date.now() } };
    return {};
  }
  return {};
};

export const getDefaultArticleQuery = user => ({
  $and: [
    {
      active: true,
      locales: { $exists: true },
    },
    queryUnpublished(user),
  ],
});

export const POPULATE_OPTIONS = {
  collection: user => ({
    path: 'collectionId',
    select: '-_id name slug description cover articles podcastCover',
    populate: {
      path: 'articles',
      match: getDefaultArticleQuery(user),
      select: ['_id', 'publishAt'],
      populate: { path: 'locales', select: ['title', 'subtitle', 'slug', 'locale'] },
    },
  }),
  locales: populateContent => ({
    path: 'locales',
    select: '-_id -__v'.concat(populateContent ? '' : ' -text'),
    populate: [
      { path: 'metadata.createdBy', select: 'email' },
      { path: 'metadata.updatedBy', select: 'email' },
    ],
  }),
  metadata: [
    { path: 'metadata.updatedBy', select: 'email' },
    { path: 'metadata.createdBy', select: 'email' },
  ],
  tags: {
    path: 'tags',
    select: '-__v -metadata -fiberyId -fiberyPublicId',
    populate: {
      path: 'topic',
      select: 'slug',
    },
  },
};

const populateWithAnalytics = user => async articles => {
  if (!checkPermissions(user, 'canManageArticles')) {
    return articles;
  }

  const analytics = keyBy(await ContentAnalytics.find(), 'slug');

  articles.forEach(({ locales: localizedArticles }, idx) => {
    Object.values(localizedArticles).forEach(({ locale, slug }) => {
      const analytic = analytics[slug];
      if (analytic && analytic.metrics) {
        set(articles, [idx, 'locales', locale, '_doc', 'metrics'], analytic.metrics);
      }
    });
  });

  return articles;
};

export const populateWithSuggestedState = user => async article => {
  if (!article.suggestedArticles) {
    return article;
  }

  return {
    ...article,
    suggestedArticles: {
      ...article.suggestedArticles,
      data: await populateStateData({
        dataLists: article.suggestedArticles.data,
        user,
        entitiesQueries: STATE_ENTITIES_QUERIES,
        includeLatestArticles: true,
      }),
    },
  };
};

ArticleSchema.statics.customQuery = function({
  query = {},
  user,
  sort,
  skip,
  limit,
  populateSuggestions = false,
  populateContent = true,
} = {}) {
  return this.find(query)
    .populate(POPULATE_OPTIONS.collection(user))
    .populate(POPULATE_OPTIONS.locales(populateContent))
    .populate(POPULATE_OPTIONS.metadata)
    .populate(POPULATE_OPTIONS.tags)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .then(articles =>
      articles.map(a => serializeArticle(a, { keepSuggestions: populateSuggestions }))
    )
    .then(populateWithAnalytics(user))
    .then(articles =>
      populateSuggestions ? articles.map(populateWithSuggestedState(user)) : articles
    );
};

const Article = mongoose.model('Article', ArticleSchema);

export default Article;
