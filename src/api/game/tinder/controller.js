import { getMapTag } from 'api/article/utils';
import { populateWithSuggestedState } from 'api/article/article.model';
import { getInitObjectMetadata } from 'api/helpers/metadata';
import { updateTags } from 'api/tag/utils';
import fibery from 'services/fibery';
import { sendJson } from 'utils/api';
import { checkIsFound } from 'utils/validation';

import TinderGame, { formatTinderGame, POPULATE_AUTHOR_TAG } from './model';

export const getOne = ({ params: { slug }, user }, res, next) =>
  TinderGame.findOne({ slug })
    .populate(POPULATE_AUTHOR_TAG)
    .then(checkIsFound)
    .then(formatTinderGame)
    .then(populateWithSuggestedState(user))
    .then(sendJson(res))
    .catch(next);

export const fiberyImport = async ({ body: { fiberyPublicId }, user }, res, next) => {
  try {
    // FIXME: metadata.createdAt everytime new
    const metadata = getInitObjectMetadata(user);

    const tinderGame = await fibery.getTinderGame({ fiberyPublicId });

    const tagsById = tinderGame.people.reduce((acc, { personTag: tag }) => {
      if (tag) {
        acc[tag.fiberyId] = tag;
      }
      return acc;
    }, {});

    const tags = Object.values(tagsById).map(getMapTag('personalities'));
    const personalities = await updateTags(tags, metadata, {
      skipValidation: false,
      skipMap: true,
    });
    const personIds = personalities.reduce(
      (acc, { fiberyId, _id }) => ({ ...acc, [fiberyId]: _id }),
      {}
    );

    tinderGame.people = tinderGame.people.map(({ personTag, ...rest }) => ({
      ...rest,
      personTag: personTag ? personIds[personTag.fiberyId] : null,
    }));

    await TinderGame.updateOne({ fiberyPublicId }, tinderGame, {
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    }).exec();

    sendJson(res)({ status: 'ok' });
  } catch (err) {
    next(err);
  }
};
