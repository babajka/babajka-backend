import Fibery from 'fibery-unofficial';
import HttpError from 'node-http-error';
import HttpStatus from 'http-status-codes';
import keyBy from 'lodash/keyBy';

import config from 'config';
import { ValidationError } from 'utils/validation';
import { map } from 'utils/func';

import { /* STATE_READY, */ DOC_SECRET_NAME, DOC_FORMAT } from './constants';
import { FIBERY_DEFAULT, ARTICLE_FIELDS, STATE, TAGS, RELATED_ENTITIES, CONTENT } from './query';
import { getArticlePublicId, addAppName, mapAppNameLocales } from './utils';
// import { getState } from './getters';
import { toWirFormat, formatEnum } from './formatters';

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
        RELATED_ENTITIES,
        CONTENT
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

  // if (getState(article) !== STATE_READY) {
  //   // FIXME
  //   throw new ValidationError({ state: 'invalid' });
  // }

  const DEFAULT_TAG_MAPPER = map(
    toWirFormat({
      mapping: { name: 'slug' },
      formatters: {
        image: toWirFormat({
          formatters: {
            files: map(toWirFormat()),
          },
        }),
      },
    })
  );

  const localeBySecret = mapAppNameLocales(['Text']).reduce((acc, key) => {
    const secret = article[key][DOC_SECRET_NAME];
    acc[secret] = key;
    return acc;
  }, {});
  const secrets = Object.keys(localeBySecret).map(secret => ({ secret }));
  const docs = keyBy(await fibery.document.getBatch(secrets, DOC_FORMAT), 'secret');
  Object.entries(localeBySecret).forEach(([secret, key]) => {
    const { content = null } = docs[secret] || {};
    article[key] = content && content.doc;
  });

  const formatArticle = toWirFormat({
    mapping: { Podcast: 'audio' },
    mapper: (key, lang = '') => (lang ? `locales.${lang}.${key}` : key),
    formatters: {
      authors: DEFAULT_TAG_MAPPER,
      brands: DEFAULT_TAG_MAPPER,
      themes: DEFAULT_TAG_MAPPER,
      times: DEFAULT_TAG_MAPPER,
      personalities: DEFAULT_TAG_MAPPER,
      locations: DEFAULT_TAG_MAPPER,

      collection: toWirFormat(),
      video: toWirFormat({ mapping: { 'Youtube Link': 'url' } }),
      audio: toWirFormat({ mapping: { 'SoundCloud Link': 'url' } }),
      cover: toWirFormat({
        formatters: {
          theme: formatEnum,
          files: map(toWirFormat()),
        },
      }),
    },
    ignore: ['state'],
  });

  return formatArticle(article);
};

export default { getArticleData };
