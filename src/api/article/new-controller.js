import { checkIsFound, isValidId } from 'utils/validation';
import { sendJson } from 'utils/api';

import fibery from 'services/fibery';

import Article, { checkIsPublished, DEFAULT_ARTICLE_QUERY } from './article.model';
import LocalizedArticle from './localized/model';
import { mapFiberyArticle } from './utils';

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

export const fiberyPreview = async ({ body: { url } }, res, next) => {
  try {
    const data = await fibery.getArticleData(url);
    const article = await mapFiberyArticle(data);
    return sendJson(res)({ article });
  } catch (err) {
    return next(err);
  }
};

export const fiberyImport = async ({ body: { url } }, res, next) => {
  try {
    const data = await fibery.getArticleData(url);

    /* some magic */

    return sendJson(res)(data);
  } catch (err) {
    return next(err);
  }
};
