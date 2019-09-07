// TODO: remove

import omit from 'lodash/omit';
import set from 'lodash/set';
import HttpStatus from 'http-status-codes';

import { checkIsFound, isValidId, ValidationError } from 'utils/validation';
import { sendJson } from 'utils/api';
import { getId } from 'utils/getters';
import {
  getInitObjectMetadata,
  updateObjectMetadata,
  mergeWithUpdateMetadata,
} from 'api/helpers/metadata';

import Article, { checkIsPublished, DEFAULT_ARTICLE_QUERY } from '../article.model';
import ArticleCollection from '../collection/model';
import LocalizedArticle from '../localized/model';

export const getAll = ({ query: { skip, take }, user }, res, next) =>
  Article.customQuery({
    query: DEFAULT_ARTICLE_QUERY(user),
    user,
    sort: { publishAt: 'desc' },
    skip: parseInt(skip) || 0, // eslint-disable-line radix
    // A limit() value of 0 is equivalent to setting no limit.
    limit: parseInt(take) || 0, // eslint-disable-line radix
  })
    .then(async data => ({
      data,
      total: await Article.find(DEFAULT_ARTICLE_QUERY(user)).countDocuments(),
    }))
    .then(sendJson(res))
    .catch(next);

const retrieveArticleId = (slugOrId, options) =>
  LocalizedArticle.findOne({ slug: slugOrId, ...options })
    .then(result => (result && result.articleId) || (isValidId(slugOrId) && slugOrId))
    .then(checkIsFound);

const getArticleById = (_id, user) =>
  Article.customQuery({
    query: { _id, active: true },
    user,
    limit: 1,
  }).then(articles => articles[0]);

export const getOne = ({ params: { slugOrId }, user }, res, next) =>
  retrieveArticleId(slugOrId, { active: true })
    .then(artId => getArticleById(artId, user))
    .then(checkIsFound)
    .then(article => checkIsPublished(article, user))
    .then(sendJson(res))
    .catch(next);

const handleArticleLocalizationError = locale => err => {
  // TODO: check this, maybe redundant
  if (err.code === 11000) {
    // This is a duplication error. For some reasons it has a slightly different
    // structure which makes us to distinguish it as a special case.
    throw new ValidationError(set({}, ['locales', locale, 'slug'], 'errors.valueDuplication'));
  }
  if (err.name === 'MongoError') {
    throw err;
  }
  throw new ValidationError({ locales: { [locale]: err.message } });
};

export const create = async ({ body, user }, res, next) => {
  try {
    const articleCollection = await ArticleCollection.findOne({ slug: body.collectionSlug }).exec();
    const collectionId = articleCollection && articleCollection._id;

    const article = Article({
      ...omit(body, ['locales', 'videoUrl']),
      metadata: getInitObjectMetadata(user),
      collectionId,
    });

    if (body.type === 'video') {
      // article.video = parseVideoUrl(body.videoUrl);
    }

    if (body.locales) {
      // Proceeding with localizations (Bundled API).
      article.locales = await Promise.all(
        Object.entries(body.locales).map(([locale, localeData]) =>
          LocalizedArticle({
            ...localeData,
            articleId: article._id,
            locale,
            metadata: getInitObjectMetadata(user),
          })
            .save()
            .then(getId)
            .catch(handleArticleLocalizationError(locale))
        )
      );
    }

    await article.save();

    if (articleCollection) {
      articleCollection.articles.push(article._id);
      await articleCollection.save();
    }

    return getArticleById(article._id, user)
      .then(sendJson(res))
      .catch(next);
  } catch (err) {
    return next(err);
  }
};

export const update = async ({ params: { slugOrId }, body, user }, res, next) => {
  try {
    const articleId = await retrieveArticleId(slugOrId).catch(next);
    const newCollection = await ArticleCollection.findOne({ slug: body.collectionSlug }).exec();

    const updFields = omit(body, ['collectionSlug', 'locales', 'videoUrl']);
    updFields.collectionId = newCollection && newCollection._id;

    const article = await Article.findOne({ _id: articleId }).exec();
    const oldArticleCollectionId = article.collectionId;
    Object.entries(updFields).forEach(([key, value]) => {
      article[key] = value;
    });

    if (article.type === 'video' && body.videoUrl) {
      // article.video = parseVideoUrl(body.videoUrl);
    }
    if (article.type === 'text') {
      article.video = undefined;
    }

    // Proceeding with localizations (Bundled API).
    let articleOldLocales = [];
    if (article.locales) {
      articleOldLocales = article.locales.slice(); // Copying.
    }
    if (body.locales) {
      article.locales = await Promise.all(
        Object.entries(body.locales).map(([locale, localeData]) =>
          LocalizedArticle.findOneAndUpdate(
            {
              locale,
              articleId,
            },
            mergeWithUpdateMetadata(localeData, user),
            { new: true }
          )
            // unless found, create a new one.
            .then(
              loc =>
                loc ||
                LocalizedArticle({
                  ...localeData,
                  articleId,
                  locale,
                  metadata: getInitObjectMetadata(user),
                }).save()
            )
            .then(getId)
            .catch(handleArticleLocalizationError(locale))
        )
      );
    }
    const newLocales = article.locales.map(l => l.toString());
    const localesToUpdate = articleOldLocales.filter(l => !newLocales.includes(l.toString()));
    await Promise.all(
      localesToUpdate.map(_id =>
        LocalizedArticle.findOneAndUpdate(
          { _id },
          mergeWithUpdateMetadata({ active: false }, user)
        ).catch(next)
      )
    );

    article.metadata = updateObjectMetadata(article.metadata, user);
    await article.save();

    if (oldArticleCollectionId !== article.collectionId) {
      // We must update both an old collection and a new collection.
      await Promise.all([
        ArticleCollection.updateOne(
          { _id: oldArticleCollectionId },
          { $pull: { articles: article._id } }
        ).exec(),
        ArticleCollection.updateOne(
          { _id: article.collectionId },
          { $push: { articles: article._id } }
        ).exec(),
      ]);
    }

    return getArticleById(article._id, user)
      .then(sendJson(res))
      .catch(next);
  } catch (err) {
    return next(err);
  }
};

export const remove = ({ params: { slugOrId }, user }, res, next) =>
  retrieveArticleId(slugOrId, { active: true })
    .then(articleId =>
      Article.updateOne({ _id: articleId }, mergeWithUpdateMetadata({ active: false }, user))
    )
    .then(() => res.sendStatus(HttpStatus.OK))
    .catch(next);
