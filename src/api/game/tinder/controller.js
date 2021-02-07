import { getMapTag } from 'api/article/utils';
import { populateWithSuggestedState } from 'api/article/article.model';
import { getInitObjectMetadata } from 'api/helpers/metadata';
import { updateTags } from 'api/tag/utils';
import { Counter } from 'api/metrics/counter';
import fibery from 'services/fibery';
import { sendJson } from 'utils/api';
import { checkIsFound, ValidationError } from 'utils/validation';

import TinderGame, { formatTinderGame, POPULATE_AUTHOR_TAG } from './model';

const STATS_ACTIONS = ['like', 'dislike'];

export const getOne = ({ params: { slug }, user }, res, next) =>
  TinderGame.findOne({ slug })
    .populate(POPULATE_AUTHOR_TAG)
    .then(checkIsFound)
    .then(formatTinderGame)
    .then(populateWithSuggestedState(user))
    .then(sendJson(res))
    .catch(next);

const generateStatsKey = ({ action, personId, slug }) =>
  `game-tinder-${slug}-${action}---${personId}`;

export const stats = async ({ body: { action, personId, slug } }, res, next) => {
  try {
    if (!STATS_ACTIONS.includes(action)) {
      next(ValidationError({ action: `should be one of '${STATS_ACTIONS}'` }));
      return;
    }

    const tinderGame = await TinderGame.findOne({ slug });
    if (!tinderGame) {
      next(ValidationError({ slug: `game not found` }));
      return;
    }

    await Counter.inc(generateStatsKey({ action, personId, slug }));

    sendJson(res)({ status: 'ok' });
  } catch (err) {
    next(err);
  }
};

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

    await Promise.all(
      tinderGame.people.reduce(
        (acc, { fiberyPublicId: personId }) => [
          ...acc,
          ...STATS_ACTIONS.map(action =>
            Counter.ensureExists(generateStatsKey({ action, personId, slug: tinderGame.slug }))
          ),
        ],
        []
      )
    );

    sendJson(res)({ status: 'ok' });
  } catch (err) {
    next(err);
  }
};
