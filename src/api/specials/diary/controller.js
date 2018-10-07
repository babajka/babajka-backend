import HttpError from 'node-http-error';

import { sendJson } from 'utils/api';

import Diary, { buildColloquialDateHash, serializeDiary } from './model';

export const getDay = async ({ params: { locale, month, day } }, res, next) => {
  try {
    const today = buildColloquialDateHash(month, day);
    const diary = await Diary.findOne({ locale, colloquialDateHash: today, active: true }).exec();

    let [bestPrev] = await Diary.find({ locale, colloquialDateHash: { $lt: today } })
      .sort({
        colloquialDateHash: 'desc',
      })
      .limit(1)
      .exec();
    if (!bestPrev) {
      // The very beginning of the year might be requested.
      [bestPrev] = await Diary.find({ locale })
        .sort({ colloquialDateHash: 'desc' })
        .limit(1)
        .exec();
      if (!bestPrev) {
        // We have no diaries at all.
        throw new HttpError(204, 'errors.diariesMissing');
      }
    }

    let [bestNext] = await Diary.find({ locale, colloquialDateHash: { $gt: today } })
      .sort({ colloquialDateHash: 'asc' })
      .limit(1)
      .exec();
    if (!bestNext) {
      // The very end of the year might be requested.
      [bestNext] = await Diary.find({ locale })
        .sort({ colloquialDate: 'asc' })
        .limit(1)
        .exec();
    }

    return sendJson(res)({
      data: serializeDiary(diary),
      prev: !!bestPrev && {
        month: bestPrev.month,
        day: bestPrev.day,
      },
      next: !!bestNext && {
        month: bestNext.month,
        day: bestNext.day,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export default getDay;
