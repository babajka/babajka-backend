import HttpError from 'node-http-error';
import HttpStatus from 'http-status-codes';

import { sendJson } from 'utils/api';
import fibery from 'services/fibery';

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
        throw new HttpError(HttpStatus.NO_CONTENT, 'errors.diariesMissing');
      }
    }

    let [bestNext] = await Diary.find({ locale, colloquialDateHash: { $gt: today } })
      .sort({ colloquialDateHash: 'asc' })
      .limit(1)
      .exec();
    if (!bestNext) {
      // The very end of the year might be requested.
      [bestNext] = await Diary.find({ locale })
        .sort({ colloquialDateHash: 'asc' })
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

export const fiberyImport = async (req, res, next) => {
  try {
    const data = await fibery.getDiaries();
    return sendJson(res)({ data });
  } catch (err) {
    return next(err);
  }
};
