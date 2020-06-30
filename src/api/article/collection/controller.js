import { sendJson } from 'utils/api';
import { checkIsFound } from 'utils/validation';

import ArticleCollection, { COLLECTION_POPULATE_OPTIONS, serializeCollection } from './model';

export const getOne = ({ params: { slug }, user }, res, next) =>
  ArticleCollection.findOne({ slug, active: true })
    .populate(COLLECTION_POPULATE_OPTIONS.articles(user))
    .then(checkIsFound)
    .then(serializeCollection)
    .then(checkIsFound)
    .then(collection => sendJson(res)({ collection }))
    .catch(next);
