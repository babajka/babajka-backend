import sample from 'lodash/sample';

import HttpError from 'node-http-error';
import HttpStatus from 'http-status-codes';

import { getMapTag } from 'api/article/utils';
import { updateTags } from 'api/tag/utils';
import { getInitObjectMetadata } from 'api/helpers/metadata';

import fibery from 'services/fibery';
import { ENUM_BASE } from 'services/fibery/constants';
import { validateList, checkIsFound } from 'utils/validation';
import { sendJson } from 'utils/api';
import { getLocalTime } from 'utils/formatting';

import Diary, {
  buildColloquialDateHash,
  serializeDiary,
  serializeDiaries,
  validateDiary,
  buildDiarySlug,
  fiberyPublicIdFromDiarySlug,
  checkDiarySlugSecretPartMatching,
  POPULATE_AUTHOR,
} from './model';

const getQuery = d => {
  if (!d) {
    return null;
  }
  const { day, month } = d;
  return { day, month, slug: buildDiarySlug(d) };
};

const getMonthNum = ({ rank }) => rank / ENUM_BASE + 1;

const getPrevNextDiaries = async today => {
  let [prevD, prevPrevD] = await Diary.find({ colloquialDateHash: { $lt: today } })
    .sort({ colloquialDateHash: 'desc' })
    .limit(2)
    .populate(POPULATE_AUTHOR);

  if (!prevD) {
    // The very beginning of the year might be requested.
    [prevD, prevPrevD] = await Diary.find({})
      .sort({ colloquialDateHash: 'desc' })
      .limit(2)
      .populate(POPULATE_AUTHOR);

    if (!prevD) {
      // We have no diaries at all.
      throw new HttpError(HttpStatus.NO_CONTENT, 'errors.diariesMissing');
    }
  }

  let [nextD] = await Diary.find({ colloquialDateHash: { $gt: today } })
    .sort({ colloquialDateHash: 'asc' })
    .limit(1);

  if (!nextD) {
    // The very end of the year might be requested.
    [nextD] = await Diary.find({})
      .sort({ colloquialDateHash: 'asc' })
      .limit(1);
  }

  return { prevD, prevPrevD, nextD };
};

export const getBySlug = async ({ params: { slug } }, res, next) => {
  try {
    const diary = await Diary.findOne({
      $and: [
        {
          $or: [
            { fiberyPublicId: fiberyPublicIdFromDiarySlug(slug) },
            { fiberyId: slug }, // For backward-compatibility.
          ],
        },
        { active: true },
      ],
    }).populate(POPULATE_AUTHOR);

    checkIsFound(diary);

    if (!checkDiarySlugSecretPartMatching({ fiberyId: diary.fiberyId, slug })) {
      throw new HttpError(HttpStatus.NOT_FOUND);
    }

    const { prevD, nextD } = await getPrevNextDiaries(diary.colloquialDateHash);

    return sendJson(res)({
      data: serializeDiary(diary),
      prev: getQuery(prevD),
      next: getQuery(nextD),
    });
  } catch (err) {
    return next(err);
  }
};

export const getDay = async ({ params: { month, day } }, res, next) => {
  try {
    const today = buildColloquialDateHash(month, day);
    const todayDiaries = await Diary.find({ colloquialDateHash: today, active: true }).populate(
      POPULATE_AUTHOR
    );
    const { prevD, prevPrevD, nextD } = await getPrevNextDiaries(today);
    // TODO: add sentry call with warning (no today diary)
    const todayDiary = sample(todayDiaries);
    const prevDiary = todayDiary ? prevD : prevPrevD;

    return sendJson(res)({
      data: serializeDiary(todayDiary || prevD),
      prev: getQuery(prevDiary),
      next: getQuery(nextD),
    });
  } catch (err) {
    return next(err);
  }
};

export const getToday = (req, res, next) => {
  const today = getLocalTime();
  return getDay(
    {
      ...req,
      params: {
        month: today.getMonth() + 1,
        day: today.getDate(),
      },
    },
    res,
    next
  );
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
