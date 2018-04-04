import { checkIsFound } from 'utils/validation';
import { sendJson } from 'utils/api';
import HttpError from 'node-http-error';

import Article from 'api/article/article.model';

import LocalizedArticle from './model';

export const create = async ({ params: { articleId }, body }, res, next) => {
  try {
    const article = await Article.findOne({ _id: articleId }).populate('locales', 'locale');
    checkIsFound(article);
    if (article.locales.map(({ locale }) => locale).includes(body.locale)) {
      throw new HttpError(400, 'Locale exists already, should be updated instead of recreation.');
    }
    const localized = await LocalizedArticle({ ...body, articleId: article._id }).save();
    article.locales.push(localized._id);
    await article.save();
    return sendJson(res)(localized);
  } catch (err) {
    return next(err);
  }
};

export const update = ({ params: { slug }, body }, res, next) =>
  LocalizedArticle.findOneAndUpdate({ slug }, body, { new: true })
    .then(checkIsFound)
    .then(sendJson(res))
    .catch(next);
