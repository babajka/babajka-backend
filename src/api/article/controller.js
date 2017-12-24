import { checkIsFound } from 'utils/validation';
import { sendJson } from 'utils/api';

import { checkRoles } from 'api/user';
import Article, { serializeArticle, checkIsPublished } from './article.model';
import ArticleType from './type.model';

export const getAll = ({ query, user }, res, next) => {
  const page = parseInt(query.page) || 0; // eslint-disable-line radix
  const pageSize = parseInt(query.pageSize) || 10; // eslint-disable-line radix
  const skip = page * pageSize;
  let data;
  const articlesQuery = {};

  if (!checkRoles(user, ['admin', 'creator'])) {
    articlesQuery.publishAt = {
      $lt: Date.now(),
    };
  }

  return Article.find(articlesQuery)
    .populate('type')
    .skip(skip)
    .limit(pageSize)
    .sort({ createdAt: 'desc' }) // FIXME(@uladbohdan): maybe change sort field on publishAt
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
    const articleTypeQuery = ArticleType.findOne({ name: body.type });
    const articleType = (await articleTypeQuery.exec()) || new ArticleType({ name: body.type });
    await articleType.save();
    const articleBody = body;
    articleBody.type = articleType._id; // eslint-disable-line no-underscore-dangle
    let data;
    let code;
    try {
      const article = Article(articleBody);
      await article.save();
      data = serializeArticle(await article.populate('type').execPopulate());
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

export const getAllTypes = async (req, res, next) =>
  ArticleType.find()
    .select('-_id -__v')
    .then(sendJson(res))
    .catch(next);
