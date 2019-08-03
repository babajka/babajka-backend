import Fibery from 'fibery-unofficial';
import HttpError from 'node-http-error';
import HttpStatus from 'http-status-codes';

import config from 'config';
import { ValidationError } from 'utils/validation';
import { map } from 'utils/func';

import { STATE_READY } from './constants';
import { FIBERY_DEFAULT, ARTICLE_FIELDS, STATE, TAGS, RELATED_ENTITIES } from './query';
import { getArticlePublicId, addAppName, mapAppNameLocales } from './utils';
import { getState } from './getters';
import { toWirFormat } from './formatters';

const fibery = new Fibery(config.services.fibery);

const getArticleData = async url => {
  const publicId = getArticlePublicId(url);
  if (!publicId) {
    // FIXME
    throw new ValidationError({ url: 'invalid' });
  }

  const [article] = await fibery.entity.query(
    {
      'q/from': addAppName('Article'),
      'q/select': FIBERY_DEFAULT.concat(
        mapAppNameLocales(ARTICLE_FIELDS),
        STATE,
        TAGS,
        RELATED_ENTITIES
      ),
      'q/where': ['=', 'fibery/public-id', '$id'],
      'q/limit': 1,
    },
    {
      $id: publicId,
    }
  );

  if (!article) {
    throw new HttpError(HttpStatus.NOT_FOUND);
  }

  if (getState(article) !== STATE_READY) {
    // FIXME
    throw new ValidationError({ state: 'invalid' });
  }

  const DEFAULT_TAG_MAPPER = map(toWirFormat({ name: 'slug' }));

  const formatArticle = toWirFormat(
    { state: false, Podcast: 'audio' },
    (key, lang = '') => (lang ? `locales.${lang}.${key}` : key),
    {
      authors: DEFAULT_TAG_MAPPER,
      brands: DEFAULT_TAG_MAPPER,
      times: DEFAULT_TAG_MAPPER,
      personalities: DEFAULT_TAG_MAPPER,
      locations: DEFAULT_TAG_MAPPER,

      collection: toWirFormat(),
      video: toWirFormat({ 'Youtube Link': 'url' }),
      audio: toWirFormat({ 'SoundCloud Link': 'url' }),
    }
  );

  return formatArticle(article);
};

export default { getArticleData };
