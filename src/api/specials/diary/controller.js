import { checkIsFound } from 'utils/validation';
import { sendJson } from 'utils/api';

import Diary from './model';

export const getDay = ({ params: { year, month, day } }, res, next) =>
  Diary.findOne({ locale: 'be', colloquialDate: `${year}-${month}-${day}`, active: true })
    .select('-_id -__v')
    .then(checkIsFound)
    .then(sendJson(res))
    .catch(next);

export default getDay;
