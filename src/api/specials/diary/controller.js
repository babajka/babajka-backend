import { checkDiaryIsFound } from 'utils/validation';
import { sendJson } from 'utils/api';
import dateFormat from 'dateformat';

import Diary from './model';

export const getDay = ({ params: { locale, month, day } }, res, next) =>
  Diary.findOne({ locale, colloquialDate: `${month}-${day}`, active: true })
    .select('-_id -__v')
    .then(checkDiaryIsFound)
    .then(async diary => {
      const date = new Date(`2018-${month}-${day}`);
      const prevDate = new Date(date);
      prevDate.setDate(date.getDate() - 1);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const [prevExists, nextExists] = await Promise.all(
        [prevDate, nextDate].map(curDate =>
          Diary.findOne({
            locale,
            colloquialDate: dateFormat(curDate, 'mm-dd'),
            active: true,
          }).then(d => Boolean(d))
        )
      );

      return {
        data: diary,
        prev: prevExists,
        next: nextExists,
      };
    })
    .then(sendJson(res))
    .catch(next);

export default getDay;
