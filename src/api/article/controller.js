import omit from 'lodash/omit';

import { checkIsFound, isValidId } from 'utils/validation';
import { sendJson } from 'utils/api';

import { User, checkPermissions } from 'api/user';
import Article, { serializeArticle, checkIsPublished, POPULATE_OPTIONS } from './article.model';
import ArticleBrand from './brand/model';
import ArticleCollection from './collection/model';
import LocalizedArticle from './localized/model';

export const getAll = ({ query, user }, res, next) => {
  const page = parseInt(query.page) || 0; // eslint-disable-line radix
  const pageSize = parseInt(query.pageSize) || 10; // eslint-disable-line radix
  const skip = page * pageSize;
  let data;
  const articlesQuery = { active: true };

  if (!checkPermissions(user, ['canManageArticles'])) {
    articlesQuery.publishAt = {
      $lt: Date.now(),
    };
  }

  return Article.find(articlesQuery)
    .populate('author', POPULATE_OPTIONS.author)
    .populate('brand', POPULATE_OPTIONS.brand)
    .populate('collectionId', POPULATE_OPTIONS.collection)
    .populate('locales', POPULATE_OPTIONS.locales)
    .sort({ publishAt: 'desc' })
    .skip(skip)
    .limit(pageSize)
    .then(articles => articles.map(serializeArticle))
    .then(articles => {
      data = articles;
      return Article.count();
    })
    .then(count => ({
      data,
      next: count > skip + pageSize && {
        page: page + 1,
        pageSize,
      },
    }))
    .then(sendJson(res))
    .catch(next);
};

const retrieveArticleId = (slugOrId, options) =>
  LocalizedArticle.findOne({ slug: slugOrId, ...options })
    .then(result => (result && result.articleId) || (isValidId(slugOrId) && slugOrId))
    .then(checkIsFound);

const getArticleById = articleId =>
  Article.findOne({ _id: articleId, active: true })
    .populate('author', POPULATE_OPTIONS.author)
    .populate('brand', POPULATE_OPTIONS.brand)
    .populate('collectionId', POPULATE_OPTIONS.collection)
    .populate('locales', POPULATE_OPTIONS.locales);

export const getOne = ({ params: { slugOrId }, user }, res, next) =>
  retrieveArticleId(slugOrId, { active: true })
    .then(getArticleById)
    .then(checkIsFound)
    .then(article => checkIsPublished(article, user))
    .then(serializeArticle)
    .then(sendJson(res))
    .catch(next);

export const create = async ({ body }, res, next) => {
  try {
    const articleBrand = await ArticleBrand.findOne({
      // TODO(uladbohdan): to deprecate body.brand.
      slug: body.brand || body.brandSlug,
    }).exec();
    checkIsFound(articleBrand, 400); // Brand is required.
    const brandId = articleBrand._id;

    const articleCollection = await ArticleCollection.findOne({ slug: body.collectionSlug }).exec();
    const collectionId = articleCollection && articleCollection._id;

    const author = await User.findOne({ email: body.authorEmail, role: 'author' }).exec();
    const authorId = author && author._id;

    const article = Article({
      ...omit(body, ['locales']),
      author: authorId,
      brand: brandId,
      collectionId,
    });

    if (body.locales) {
      // Proceeding with localizations (Bundled API).
      article.locales = await Promise.all(
        Object.entries(body.locales).map(([locale, localeData]) =>
          LocalizedArticle({
            ...localeData,
            articleId: article._id,
            locale,
          })
            .save()
            .then(({ _id }) => _id)
            .catch(next)
        )
      );
    }

    await article.save();

    return getArticleById(article._id)
      .then(serializeArticle)
      .then(sendJson(res))
      .catch(next);
  } catch (err) {
    return next(err);
  }
};

export const update = async ({ params: { slugOrId }, body }, res, next) => {
  try {
    const articleId = await retrieveArticleId(slugOrId).catch(next);
    const [newBrand, newCollection, newAuthor] = await Promise.all([
      // TODO(uladbohdan): to deprecate body.brand.
      ArticleBrand.findOne({ slug: body.brand || body.brandSlug }).exec(),
      ArticleCollection.findOne({ slug: body.collectionSlug }).exec(),
      User.findOne({ email: body.authorEmail, role: 'author' }).exec(),
    ]);

    const updFields = omit(body, [
      'author',
      'authorEmail',
      'brand',
      'brandSlug',
      'collectionSlug',
      'locales',
    ]);
    if (newBrand) {
      updFields.brand = newBrand._id;
    }
    updFields.collectionId = newCollection && newCollection._id;
    updFields.author = newAuthor && newAuthor._id;

    const article = await Article.findOne({ _id: articleId }).exec();
    Object.entries(updFields).forEach(([key, value]) => {
      article[key] = value;
    });

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
            localeData,
            { new: true }
          )
            // unless found, create a new one.
            .then(loc => loc || LocalizedArticle({ ...localeData, articleId }).save())
            .then(({ _id }) => _id)
            .catch(next)
        )
      );
    }
    const newLocales = article.locales.map(l => l.toString());
    const localesToUpdate = articleOldLocales.filter(l => !newLocales.includes(l.toString()));
    await Promise.all(
      localesToUpdate.map(_id =>
        LocalizedArticle.findOneAndUpdate({ _id }, { active: false }).catch(next)
      )
    );

    await article.save();

    return getArticleById(article._id)
      .then(serializeArticle)
      .then(sendJson(res))
      .catch(next);
  } catch (err) {
    return next(err);
  }
};

export const remove = ({ params: { slugOrId } }, res, next) =>
  retrieveArticleId(slugOrId, { active: true })
    .then(articleId => Article.update({ _id: articleId }, { active: false }))
    .then(() => res.sendStatus(200))
    .catch(next);
