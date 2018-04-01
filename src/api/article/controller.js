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

export const getOne = ({ params: { slugOrId }, user }, res, next) =>
  LocalizedArticle.findOne({ slug: slugOrId })
    .then(result => (result && result.articleId) || (isValidId(slugOrId) && slugOrId))
    .then(checkIsFound)
    .then(articleId =>
      Article.findOne({ _id: articleId, active: true })
        .populate('author', POPULATE_OPTIONS.author)
        .populate('brand', POPULATE_OPTIONS.brand)
        .populate('collectionId', POPULATE_OPTIONS.collection)
        .populate('locales', POPULATE_OPTIONS.locales)
    )
    .then(checkIsFound)
    .then(article => checkIsPublished(article, user))
    .then(serializeArticle)
    .then(sendJson(res))
    .catch(next);

export const create = async ({ body }, res, next) => {
  try {
    const articleBrandQuery = ArticleBrand.findOne({ slug: body.brand });
    const articleBrand = (await articleBrandQuery.exec()) || new ArticleBrand({ slug: body.brand });
    await articleBrand.save();

    const articleCollection = await ArticleCollection.findOne({ slug: body.collectionSlug }).exec();

    const author = await User.findOne({ email: body.authorEmail }).exec();

    const articleBody = {
      ...body,
      author: author && author._id,
      brand: articleBrand._id,
      collectionId: articleCollection && articleCollection._id,
    };

    let data;
    let code;
    try {
      const article = Article(articleBody);
      await article.save();
      data = serializeArticle(
        await article
          .populate('author', POPULATE_OPTIONS.author)
          .populate('brand', POPULATE_OPTIONS.brand)
          .populate('collectionId', POPULATE_OPTIONS.collection)
          .execPopulate()
      );
      if (articleCollection) {
        articleCollection.articles.push(article._id);
        await articleCollection.save();
      }
    } catch (err) {
      code = 400;
      data = err;
    }
    sendJson(res, code)(data);
  } catch (err) {
    next(err);
  }
};

export const update = ({ params: { slugOrId }, body }, res, next) =>
  LocalizedArticle.findOne({ slug: slugOrId })
    .then(result => (result && result.articleId) || (isValidId(slugOrId) && slugOrId))
    .then(checkIsFound)
    .then(articleId =>
      Article.findOneAndUpdate({ _id: articleId }, body, { new: true })
        .populate('author', POPULATE_OPTIONS.author)
        .populate('brand', POPULATE_OPTIONS.brand)
        .populate('collectionId', POPULATE_OPTIONS.collection)
        .populate('locales', POPULATE_OPTIONS.locales)
    )
    .then(checkIsFound)
    .then(serializeArticle)
    .then(sendJson(res))
    .catch(next);

export const remove = ({ params: { slugOrId } }, res, next) =>
  LocalizedArticle.findOne({ slug: slugOrId })
    .then(result => (result && result.articleId) || (isValidId(slugOrId) && slugOrId))
    .then(checkIsFound)
    .then(articleId => Article.update({ _id: articleId }, { active: false }))
    .then(() => res.sendStatus(200))
    .catch(next);
