import { sendJson } from 'utils/api';

import ArticleBrand from './model';

export const getAll = (req, res, next) =>
  ArticleBrand.find()
    .select('-_id -__v')
    .then(sendJson(res))
    .catch(next);

export default getAll;
