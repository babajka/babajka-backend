import sample from 'lodash/sample';

import { getMapTag } from 'api/article/utils';
import { getInitObjectMetadata } from 'api/helpers/metadata';
import { updateTags } from 'api/tag/utils';
import fibery from 'services/fibery';
import { sendJson } from 'utils/api';
import { checkIsFound } from 'utils/validation';

import { populateWithSuggestedState } from 'api/article/article.model';

import FortuneGame, { formatFortuneCookie, formatFortuneGame, POPULATE_AUTHOR_TAG } from './model';

export const getOne = ({ params: { slug }, user }, res, next) =>
  FortuneGame.findOne({ slug })
    .select('-cookies')
    .then(checkIsFound)
    .then(formatFortuneGame)
    .then(populateWithSuggestedState(user))
    .then(sendJson(res))
    .catch(next);

export const getCookie = ({ params: { slug } }, res, next) =>
  FortuneGame.findOne({ slug })
    .populate(POPULATE_AUTHOR_TAG)
    .then(checkIsFound)
    .then(fortuneGame => sample(fortuneGame.cookies))
    .then(formatFortuneCookie)
    .then(sendJson(res))
    .catch(next);

export const fiberyImport = async ({ body: { fiberyPublicId }, user }, res, next) => {
  try {
    // FIXME: metadata.createdAt everytime new
    const metadata = getInitObjectMetadata(user);

    const fortuneGame = await fibery.getFortuneGame({ fiberyPublicId });

    const tagsById = fortuneGame.cookies.reduce((acc, { authorTag: tag }) => {
      if (tag) {
        acc[tag.fiberyId] = tag;
      }
      return acc;
    }, {});

    const tags = Object.values(tagsById).map(getMapTag('personalities'));
    const authors = await updateTags(tags, metadata, { skipValidation: false, skipMap: true });
    const authorsIds = authors.reduce(
      (acc, { fiberyId, _id }) => ({ ...acc, [fiberyId]: _id }),
      {}
    );

    fortuneGame.cookies = fortuneGame.cookies.map(({ authorTag, ...rest }) => ({
      ...rest,
      authorTag: authorTag ? authorsIds[authorTag.fiberyId] : null,
    }));

    await FortuneGame.updateOne({ fiberyPublicId: fortuneGame.fiberyPublicId }, fortuneGame, {
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    }).exec();

    sendJson(res)({ status: 'ok' });
  } catch (err) {
    next(err);
  }
};
