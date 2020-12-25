import { sendJson } from 'utils/api';
import { checkIsFound } from 'utils/validation';

import Counter, { formatCounter } from './model';

export const get = ({ params: { key } }, res, next) =>
  Counter.findOne({ key })
    .then(checkIsFound)
    .then(formatCounter)
    .then(sendJson(res))
    .catch(next);
