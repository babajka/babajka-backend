import { sendJson } from 'utils/api';

import ContentAnalytics from './model';

export const getAll = (_, res, next) =>
  ContentAnalytics.find({})
    .select('-_id -__v')
    .then(sendJson(res))
    .catch(next);
