import omit from 'lodash/omit';
import set from 'lodash/set';
import HttpStatus from 'http-status-codes';

import { checkIsFound, isValidId, ValidationError } from 'utils/validation';
import { sendJson } from 'utils/api';
import { parseVideoUrl } from 'utils/networks';
import {
  getInitObjectMetadata,
  updateObjectMetadata,
  mergeWithUpdateMetadata,
} from 'api/helpers/metadata';

import { User } from 'api/user';
import Article, { checkIsPublished, DEFAULT_ARTICLE_QUERY } from './article.model';
import ArticleBrand from './brand/model';
import ArticleCollection from './collection/model';
import LocalizedArticle from './localized/model';

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

const getArticleById = (articleId, user) =>
  Article.customQuery({
    query: { _id: articleId, active: true },
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
  if (err.code === 11000) {
    // This is a duplication error. For some reasons it has a slightly different
    // structure which makes us to distinguish it as a special case.
    throw new ValidationError(set({}, ['locales', locale, 'slug'], 'errors.valueDuplication'));
  }
  if (err.name === 'MongoError') {
    throw err;
  }
  const msg = {};
  Object.values(err.errors).forEach(({ path, message }) => {
    set(msg, ['locales', locale, path], message);
  });
  throw new ValidationError(msg);
};

export const create = async ({ body, user }, res, next) => {
  try {
    const articleBrand = await ArticleBrand.findOne({
      slug: body.brandSlug,
    }).exec();
    checkIsFound(articleBrand, HttpStatus.BAD_REQUEST); // Brand is required.
    const brandId = articleBrand._id;

    const articleCollection = await ArticleCollection.findOne({ slug: body.collectionSlug }).exec();
    const collectionId = articleCollection && articleCollection._id;

    const author = await User.findOne({ email: body.authorEmail, role: 'author' }).exec();
    const authorId = author && author._id;

    const article = Article({
      ...omit(body, ['locales', 'videoUrl']),
      author: authorId,
      brand: brandId,
      metadata: getInitObjectMetadata(user),
      collectionId,
    });

    if (body.type === 'video') {
      article.video = parseVideoUrl(body.videoUrl);
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
            .then(({ _id }) => _id)
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
    const [newBrand, newCollection, newAuthor] = await Promise.all([
      ArticleBrand.findOne({ slug: body.brandSlug }).exec(),
      ArticleCollection.findOne({ slug: body.collectionSlug }).exec(),
      User.findOne({ email: body.authorEmail, role: 'author' }).exec(),
    ]);

    const updFields = omit(body, [
      'author',
      'authorEmail',
      'brandSlug',
      'collectionSlug',
      'locales',
      'videoUrl',
    ]);
    if (newBrand) {
      updFields.brand = newBrand._id;
    }
    updFields.collectionId = newCollection && newCollection._id;
    updFields.author = newAuthor && newAuthor._id;

    const article = await Article.findOne({ _id: articleId }).exec();
    const oldArticleCollectionId = article.collectionId;
    Object.entries(updFields).forEach(([key, value]) => {
      article[key] = value;
    });

    if (article.type === 'video' && body.videoUrl) {
      article.video = parseVideoUrl(body.videoUrl);
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
            mergeWithUpdateMetadata(localeData, user._id),
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
            .then(({ _id }) => _id)
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
          mergeWithUpdateMetadata({ active: false }, user._id)
        ).catch(next)
      )
    );

    article.metadata = updateObjectMetadata(article.metadata.toObject(), user);
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
      Article.updateOne({ _id: articleId }, mergeWithUpdateMetadata({ active: false }, user._id))
    )
    .then(() => res.sendStatus(HttpStatus.OK))
    .catch(next);
