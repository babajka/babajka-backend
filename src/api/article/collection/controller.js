import { checkIsFound } from 'utils/validation';
import { sendJson } from 'utils/api';

import { ArticleCollection, serializeCollection } from './model';

export const getAll = (req, res, next) =>
  ArticleCollection.find({ active: true })
    .populate({
      path: 'articles',
      populate: {
        path: 'locales',
      },
    })
    .then(checkIsFound)
    .then(collections => collections.map(serializeCollection))
    .then(sendJson(res))
    .catch(next);

export const getOne = ({ params: { slug } }, res, next) =>
  ArticleCollection.findOne({ slug, active: true })
    .populate({
      path: 'articles',
      populate: {
        path: 'locales',
      },
    })
    .then(checkIsFound)
    .then(serializeCollection)
    .then(sendJson(res))
    .catch(next);

export const create = ({ body }, res, next) =>
  ArticleCollection(body)
    .save()
    .then(sendJson(res))
    .catch(next);

export const update = ({ params: { slug }, body }, res, next) =>
  ArticleCollection.findOneAndUpdate({ slug }, body, { new: true })
    .then(checkIsFound)
    .then(sendJson(res))
    .catch(next);

export const remove = ({ params: { slug } }, res, next) =>
  ArticleCollection.findOneAndUpdate({ slug }, { active: false }, { new: true })
    .then(checkIsFound)
    .then(() => res.sendStatus(200))
    .catch(next);
