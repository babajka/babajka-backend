import sample from 'lodash/sample';

import fibery from 'services/fibery';
import { sendJson } from 'utils/api';

import { populateWithSuggestedState } from 'api/article/article.model';

import FortuneGame, { formatFortuneCookie, formatFortuneGame } from './model';

export const getDescription = ({ params: { slug }, user }, res, next) =>
  FortuneGame.findOne({ slug })
    .select('-cookies')
    .then(formatFortuneGame)
    .then(populateWithSuggestedState(user))
    .then(sendJson(res))
    .catch(next);

export const getCookie = ({ params: { slug } }, res, next) =>
  FortuneGame.findOne({ slug })
    .then(fortuneGame => sample(fortuneGame.cookies))
    .then(formatFortuneCookie)
    .then(sendJson(res))
    .catch(next);

export const fiberyImport = ({ params: { slug } }, res, next) =>
  fibery
    .getFortuneGame({ slug })
    .then(fortuneGame =>
      FortuneGame.updateOne({ fiberyPublicId: fortuneGame.fiberyPublicId }, fortuneGame, {
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      })
    )
    .then(sendJson(res))
    .catch(next);
