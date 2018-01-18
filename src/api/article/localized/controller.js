import { checkIsFound } from 'utils/validation';
import { sendJson } from 'utils/api';
import HttpError from 'node-http-error';

import Article from 'api/article/article.model';

import LocalizedArticle from './model';

export const create = ({ params: { articleId }, body }, res, next) =>
  Article.findOne({ _id: articleId })
    .populate('locales', 'locale')
    .then(checkIsFound)
    .then(article => {
      article.locales.forEach(loc => {
        if (loc.locale === body.locale) {
          throw new HttpError(
            400,
            'Locale exists already, should be updated instead of recreation.'
          );
        }
      });
      return article;
    })
    .then(article => {
      LocalizedArticle({ ...body, articleId: article._id })
        .save()
        .then(async data => {
          article.locales.push(data._id);
          await article.save();
          return data;
        })
        .then(sendJson(res))
        .catch(next);
    })
    .catch(next);

export const update = ({ params: { slug }, body }, res, next) =>
  LocalizedArticle.findOneAndUpdate({ slug }, body, { new: true })
    .then(checkIsFound)
    .then(sendJson(res))
    .catch(next);
