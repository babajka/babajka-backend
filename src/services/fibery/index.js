import Fibery from 'fibery-unofficial';
import HttpError from 'node-http-error';
import HttpStatus from 'http-status-codes';
import keyBy from 'lodash/keyBy';

import config from 'config';
import { ValidationError } from 'utils/joi';
import { map } from 'utils/func';

import {
  /* STATE_READY, */
  DOC_SECRET_NAME,
  DOC_FORMAT,
  MAIN_PAGE_STATE_PUBLIC_ID,
  SIDEBAR_STATE_PUBLIC_ID,
} from './constants';
import {
  FIBERY_DEFAULT,
  ARTICLE_FIELDS,
  ARTICLE_LOC_FIELDS,
  STATE,
  TAGS,
  RELATED_ENTITIES,
  CONTENT,
  DIARY_FIELDS,
  DOCUMENT_VIEW,
} from './query';
import { getArticlePublicId, addAppName, mapAppName, mapAppNameLocales, mapSecrets } from './utils';
// import { getState } from './getters';
import {
  toWirFormat,
  formatEnum,
  IMAGE_FORMATTER,
  TAGS_FORMATTER,
  TAG_FORMATTER,
  processDocumentConstructor,
} from './formatters';

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
    mapping: { Podcast: 'audio', 'Publication Time': 'publishAt' },
    mapper: (key, lang = '') => (lang ? `locales.${lang}.${key}` : key),
    formatters: {
      authors: TAGS_FORMATTER,
      brands: TAGS_FORMATTER,
      themes: TAGS_FORMATTER,
      times: TAGS_FORMATTER,
      personalities: TAGS_FORMATTER,
      locations: TAGS_FORMATTER,

      collection: toWirFormat({
        formatters: {
          cover: IMAGE_FORMATTER,
        },
      }),
      video: toWirFormat({ mapping: { 'Youtube Link': 'url' } }),
      audio: toWirFormat({
        mapping: { 'SoundCloud Link': 'url' },
        formatters: {
          files: map(toWirFormat()),
        },
      }),
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
    formatters: {
      personality: TAG_FORMATTER,
      locale: formatEnum,
      month: toWirFormat(),
    },
  });
  return diaries.map(formatDiary);
};

const getDocument = async fiberyPublicID => {
  const [document] = await fibery.entity.query(DOCUMENT_VIEW, { $id: fiberyPublicID });
  if (!document) {
    throw new HttpError(HttpStatus.NOT_FOUND);
  }
  const secret = document['fibery/meta'].documentSecret;
  const rawContent = JSON.parse(await fibery.document.get(secret, DOC_FORMAT));
  if (!rawContent) {
    throw new HttpError(HttpStatus.NOT_FOUND);
  }

  return processDocumentConstructor(rawContent.content.doc.content);
};

const getMainPageState = () => getDocument(MAIN_PAGE_STATE_PUBLIC_ID);

const getSidebarState = () => getDocument(SIDEBAR_STATE_PUBLIC_ID);

export default { getArticleData, getDiaries, getMainPageState, getSidebarState };
