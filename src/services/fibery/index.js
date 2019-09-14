import Fibery from 'fibery-unofficial';
import HttpError from 'node-http-error';
import HttpStatus from 'http-status-codes';
import keyBy from 'lodash/keyBy';

import config from 'config';
import { ValidationError } from 'utils/validation';
import { map } from 'utils/func';

import { /* STATE_READY, */ DOC_SECRET_NAME, DOC_FORMAT } from './constants';
import {
  FIBERY_DEFAULT,
  ARTICLE_FIELDS,
  ARTICLE_LOC_FIELDS,
  STATE,
  TAGS,
  RELATED_ENTITIES,
  CONTENT,
  DIARY_FIELDS,
} from './query';
import { getArticlePublicId, addAppName, mapAppName, mapAppNameLocales, mapSecrets } from './utils';
// import { getState } from './getters';
import { toWirFormat, formatEnum, IMAGE_FORMATER, TAGS_FORMATER, TAG_FORMATER } from './formatters';

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
        mapAppName(ARTICLE_FIELDS),
        mapAppNameLocales(ARTICLE_LOC_FIELDS),
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
  //   throw new ValidationError({ state: 'invalid' });
  // }

  const localeBySecret = mapAppNameLocales(['Text']).reduce((acc, key) => {
    const secret = article[key][DOC_SECRET_NAME];
    acc[secret] = key;
    return acc;
  }, {});
  const secrets = mapSecrets(Object.keys(localeBySecret));
  const docs = keyBy(await fibery.document.getBatch(secrets, DOC_FORMAT), 'secret');
  Object.entries(localeBySecret).forEach(([secret, key]) => {
    const { content = null } = docs[secret] || {};
    article[key] = content && content.doc;
  });

  const formatArticle = toWirFormat({
    mapping: { Podcast: 'audio', publication: 'publishAt' },
    mapper: (key, lang = '') => (lang ? `locales.${lang}.${key}` : key),
    formatters: {
      authors: TAGS_FORMATER,
      brands: TAGS_FORMATER,
      themes: TAGS_FORMATER,
      times: TAGS_FORMATER,
      personalities: TAGS_FORMATER,
      locations: TAGS_FORMATER,

      collection: toWirFormat({
        formatters: {
          cover: IMAGE_FORMATER,
        },
      }),
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

// TODO: add `month` input param (to reduce data amount)
const getDiaries = async () => {
  const data = await fibery.entity.query({
    'q/from': addAppName('Diary'),
    'q/select': FIBERY_DEFAULT.concat(DIARY_FIELDS),
    'q/limit': 'q/no-limit',
  });

  const TEXT = addAppName('Text');
  const secrets = data.map((d, index) => ({
    secret: d[TEXT][DOC_SECRET_NAME],
    index,
  }));
  const docs = keyBy(await fibery.document.getBatch(secrets, DOC_FORMAT), 'secret');
  const secretByIndex = keyBy(secrets, 'index');
  const diaries = data.map((d, i) => {
    const { secret } = secretByIndex[i];
    const { content = null } = docs[secret] || {};
    return { ...d, [TEXT]: content && content.doc };
  });

  const formatDiary = toWirFormat({
    mapping: { Personality: 'author' },
    formatters: {
      author: TAG_FORMATER,
      locale: formatEnum,
      month: formatEnum,
    },
  });
  return diaries.map(formatDiary);
};

export default { getArticleData, getDiaries };
