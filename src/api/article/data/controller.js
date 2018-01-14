import { checkIsFound } from 'utils/validation';
import { sendJson } from 'utils/api';

import Article from 'api/article/article.model';

import ArticleData from './model';

export const create = async ({ params: { articleId }, body }, res, next) => {
  let article;
  try {
    article = await Article.findOne({ _id: articleId }).exec();
  } catch (err) {
    next(err);
  }

  return ArticleData({ ...body, articleId: article._id })
    .save()
    .then(async data => {
      article.locales.push(data._id);
      await article.save();
      return data;
    })
    .then(sendJson(res))
    .catch(next);
};

export const update = ({ params: { slug }, body }, res, next) =>
  ArticleData.findOneAndUpdate({ slug }, body, { new: true })
    .then(checkIsFound)
    .then(sendJson(res))
    .catch(next);
