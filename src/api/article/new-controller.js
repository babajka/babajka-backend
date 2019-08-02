import { checkIsFound, isValidId } from 'utils/validation';
import { sendJson } from 'utils/api';

import { getArticleData } from 'services/fibery';

import Article, { checkIsPublished, DEFAULT_ARTICLE_QUERY } from './article.model';
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

export const fiberyImport = async ({ body }, res, next) => {
  try {
    const { url } = body;
    const data = await getArticleData(url);

    /* some magic */

    return sendJson(res)(data);
  } catch (err) {
    return next(err);
  }
};
