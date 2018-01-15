import { checkIsFound } from 'utils/validation';
import { sendJson } from 'utils/api';

import Article from 'api/article/article.model';

import ArticleData from './model';

export const create = async ({ params: { articleId }, body }, res, next) =>
  Article.findOne({ _id: articleId })
    .then(checkIsFound)
    .then(article => {
      ArticleData({ ...body, articleId: article._id })
        .save()
        .then(data => {
          article.locales.push(data._id);
          return data;
        })
        .then(data => {
          article.save();
          return data;
        })
        .then(sendJson(res))
        .catch(next);
    })
    .catch(next);

export const update = ({ params: { slug }, body }, res, next) =>
  ArticleData.findOneAndUpdate({ slug }, body, { new: true })
    .then(checkIsFound)
    .then(sendJson(res))
    .catch(next);
