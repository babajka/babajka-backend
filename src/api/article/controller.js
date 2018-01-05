import { checkIsFound } from 'utils/validation';
import { sendJson } from 'utils/api';

import { checkPermission } from 'api/user';
import Article, { serializeArticle, checkIsPublished } from './article.model';
import ArticleBrand from './brand.model';

export const getAll = ({ query, user }, res, next) => {
  const page = parseInt(query.page) || 0; // eslint-disable-line radix
  const pageSize = parseInt(query.pageSize) || 10; // eslint-disable-line radix
  const skip = page * pageSize;
  let data;
  const articlesQuery = {};

  if (!checkPermission(user, 'canManageArticles')) {
    articlesQuery.publishAt = {
      $lt: Date.now(),
    };
  }

  return Article.find(articlesQuery)
    .populate('brand')
    .sort({ publishAt: 'desc' })
    .skip(skip)
    .limit(pageSize)
    .then(atricles => atricles)
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

export const getOne = ({ params: { slug }, user }, res, next) =>
  Article.findOne({ slug })
    .then(checkIsFound)
    .then(article => checkIsPublished(article, user))
    .then(serializeArticle)
    .then(sendJson(res))
    .catch(next);

export const create = async ({ body }, res, next) => {
  try {
    const articleBrandQuery = ArticleBrand.findOne({ name: body.brand });
    const articleBrand = (await articleBrandQuery.exec()) || new ArticleBrand({ name: body.brand });
    await articleBrand.save();
    const articleBody = body;
    articleBody.brand = articleBrand._id; // eslint-disable-line no-underscore-dangle
    let data;
    let code;
    try {
      const article = Article(articleBody);
      await article.save();
      data = serializeArticle(await article.populate('brand').execPopulate());
    } catch (err) {
      code = 400;
      data = err;
    }
    sendJson(res, code)(data);
  } catch (err) {
    next(err);
  }
};

export const update = ({ params: { slug }, body }, res, next) =>
  Article.findOneAndUpdate({ slug }, body, { new: true })
    .then(checkIsFound)
    .then(sendJson(res))
    .catch(next);

export const remove = async ({ params: { slug } }, res, next) =>
  Article.findOneAndRemove({ slug })
    .then(checkIsFound)
    .then(() => res.sendStatus(200))
    .catch(next);

export const getAllBrands = async (req, res, next) =>
  ArticleBrand.find()
    .select('-_id -__v')
    .then(sendJson(res))
    .catch(next);
