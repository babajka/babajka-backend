import sample from 'lodash/sample';

import HttpError from 'node-http-error';
import HttpStatus from 'http-status-codes';

import { getMapTag } from 'api/article/utils';
import { updateTags } from 'api/tag/utils';
import { getInitObjectMetadata } from 'api/helpers/metadata';

import fibery from 'services/fibery';
import { ENUM_BASE } from 'services/fibery/constants';
import { validateList } from 'utils/validation';
import { sendJson } from 'utils/api';

import Diary, {
  buildColloquialDateHash,
  serializeDiary,
  serializeDiaries,
  validateDiary,
} from './model';

const getQuery = d => {
  if (!d) {
    return null;
  }
  const { day, month } = d;
  return { day, month };
};

const getMonthNum = ({ rank }) => rank / ENUM_BASE + 1;

export const getDay = async ({ params: { month, day } }, res, next) => {
  try {
    const today = buildColloquialDateHash(month, day);
    const diaries = await Diary.find({ colloquialDateHash: today, active: true }).populate(
      'author'
    );
    const diary = sample(diaries);

    let [bestPrev] = await Diary.find({ colloquialDateHash: { $lt: today } })
      .sort({ colloquialDateHash: 'desc' })
      .limit(1);

    if (!bestPrev) {
      // The very beginning of the year might be requested.
      [bestPrev] = await Diary.find({})
        .sort({ colloquialDateHash: 'desc' })
        .limit(1);

      if (!bestPrev) {
        // We have no diaries at all.
        throw new HttpError(HttpStatus.NO_CONTENT, 'errors.diariesMissing');
      }
    }

    let [bestNext] = await Diary.find({ colloquialDateHash: { $gt: today } })
      .sort({ colloquialDateHash: 'asc' })
      .limit(1);

    if (!bestNext) {
      // The very end of the year might be requested.
      [bestNext] = await Diary.find({})
        .sort({ colloquialDateHash: 'asc' })
        .limit(1);
    }

    return sendJson(res)({
      data: serializeDiary(diary),
      prev: getQuery(bestPrev),
      next: getQuery(bestNext),
    });
  } catch (err) {
    return next(err);
  }
};

export const fiberyImport = async ({ user }, res, next) => {
  try {
    // FIXME: metadata.createdAt everytime new
    const metadata = getInitObjectMetadata(user);

    const data = await fibery.getDiaries();
    const tagsById = data.reduce((acc, { personality: tag }) => {
      if (tag) {
        acc[tag.fiberyId] = tag;
      }
      return acc;
    }, {});

    const tags = Object.values(tagsById).map(getMapTag('personalities'));
    const authors = await updateTags(tags, metadata, { skipValidation: true, skipMap: true });
    const authorsIds = authors.reduce(
      (acc, { fiberyId, _id }) => ({ ...acc, [fiberyId]: _id }),
      {}
    );
    const diariesData = data.map(({ personality, day, month, ...rest }) => ({
      ...rest,
      author: authorsIds[personality.fiberyId],
      colloquialDateHash: getMonthNum(month) * 100 + day,
    }));

    await validateList(diariesData, validateDiary, 'diaries');

    await Promise.all(
      diariesData.map(d =>
        // Q: why not `findOneAndUpdate`?
        Diary.updateOne({ fiberyId: d.fiberyId }, d, {
          upsert: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        }).exec()
      )
    );

    const diaries = serializeDiaries(await Diary.find({}).populate('author'));
    return sendJson(res)({ diaries });
  } catch (err) {
    return next(err);
  }
};
