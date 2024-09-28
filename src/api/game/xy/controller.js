import sample from 'lodash/sample';

import { populateWithSuggestedState } from 'api/article/article.model';
import { Counter } from 'api/metrics/counter';
import fibery from 'services/fibery';
import { sendJson } from 'utils/api';
import { checkIsFound } from 'utils/validation';
import { ValidationError } from 'utils/joi';

import XYGame, { formatXYGameOutcome, formatXYGame } from './model';

const generateStatsKey = ({ slug, input }) => `game-xy-${slug}--${input}`;

export const getOne = ({ params: { slug }, user }, res, next) =>
  XYGame.findOne({ 'slug.be': slug })
    .select('-outcomes')
    .then(checkIsFound)
    .then(formatXYGame)
    .then(populateWithSuggestedState(user))
    .then(sendJson(res))
    .catch(next);

export const getOutcome = ({ params: { slug }, body: { input } }, res, next) =>
  XYGame.findOne({ 'slug.be': slug })
    .then(checkIsFound)
    .then(xyGame =>
      sample(xyGame.outcomes.filter(({ input: outcomeInput }) => `${outcomeInput}` === `${input}`))
    )
    .then(checkIsFound)
    .then(async outcome => {
      await Counter.inc(generateStatsKey({ slug, input }));
      return outcome;
    })
    .then(formatXYGameOutcome)
    .then(sendJson(res))
    .catch(next);

export const fiberyImport = async ({ body: { fiberyPublicId } }, res, next) => {
  try {
    const xyGame = await fibery.getXYGame({ fiberyPublicId });

    if (['ny2021', 'belarusian-writers', 'tinder'].includes(xyGame.slug.be)) {
      // TODO: Replace this list of hardcoded slugs with a search on Fortune Collections and Tinder games.
      throw new ValidationError({
        slug: {
          be: `reusing slugs from non-XY games is not allowed, attempted on '${xyGame.slug.be}'`,
        },
      });
    }

    // Note: If new localizations are added, explicit check on the uniqueness of the slug between locales will be needed.

    const allGameSlugs = await XYGame.where('fiberyPublicId')
      .ne(fiberyPublicId)
      .distinct('slug.be')
      .exec();
    if (allGameSlugs.includes(xyGame.slug.be)) {
      throw new ValidationError({
        slug: {
          be: `slug '${xyGame.slug.be}' is already used for XY Games`,
        },
      });
    }

    await XYGame.updateOne({ fiberyPublicId }, xyGame, {
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    }).exec();

    await Promise.all(
      xyGame.outcomes.reduce(
        (acc, { input }) =>
          acc.concat(Counter.ensureExists(generateStatsKey({ slug: xyGame.slug.be, input }))),
        []
      )
    );

    sendJson(res)({ status: 'ok' });
  } catch (err) {
    next(err);
  }
};
