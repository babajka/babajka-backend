import { checkDiaryIsFound } from 'utils/validation';
import { sendJson } from 'utils/api';

import Diary from './model';

export const getDay = ({ params: { locale, month, day } }, res, next) =>
  Diary.findOne({ locale, colloquialDate: `${month}-${day}`, active: true })
    .select('-_id -__v')
    .then(checkDiaryIsFound)
    .then(sendJson(res))
    .catch(next);

export default getDay;
