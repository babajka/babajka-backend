// TODO: remove

import HttpStatus from 'http-status-codes';

import { checkIsFound } from 'utils/validation';
import { sendJson } from 'utils/api';

import ArticleCollection, {
  serializeCollection,
  COLLECTION_POPULATE_OPTIONS,
} from 'api/article/collection/model';

export const getAll = ({ user }, res, next) =>
  ArticleCollection.find({ active: true })
    .populate(COLLECTION_POPULATE_OPTIONS.articles(user))
    .then(checkIsFound)
    .then(collections => collections.map(serializeCollection))
    .then(sendJson(res))
    .catch(next);

export const getOne = ({ params: { slug }, user }, res, next) =>
  ArticleCollection.findOne({ slug, active: true })
    .populate(COLLECTION_POPULATE_OPTIONS.articles(user))
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
    .then(() => res.sendStatus(HttpStatus.OK))
    .catch(next);
