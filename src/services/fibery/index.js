import Fibery from 'fibery-unofficial';
import HttpError from 'node-http-error';
import HttpStatus from 'http-status-codes';
import keyBy from 'lodash/keyBy';
import flatten from 'lodash/flatten';
import isEqual from 'lodash/isEqual';
import trimStart from 'lodash/trimStart';

import config from 'config';
import { ValidationError } from 'utils/joi';
import { map } from 'utils/func';

import { buildState } from 'api/storage/stateConstructors';
import {
  /* STATE_READY, */
  DOC_SECRET_NAME,
  DOC_FORMAT,
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
  SUGGESTED_ARTICLES,
  FORTUNE_COLLECTION_FIELDS,
  TINDER_GAME_FIELDS,
  STATE_CONSTRUCTOR_FIELDS,
  XY_GAME_FIELDS,
} from './query';
import { getArticlePublicId, addAppName, mapAppName, mapAppNameLocales, mapSecrets } from './utils';
import { getFileUrl } from './getters';
import {
  toWirFormat,
  formatEnum,
  convertToString,
  IMAGE_FORMATTER,
  TAGS_FORMATTER,
  TAG_FORMATTER,
  processDocumentConstructor,
} from './formatters';

const fibery = new Fibery(config.services.fibery);

const getDoc = (docs, secret) => {
  const { content = null } = docs[secret] || {};
  return content && content.doc;
};

const getArticleData = async ({ url, fiberyPublicId }) => {
  const publicId = fiberyPublicId || getArticlePublicId(url);
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

  // At some point, Fibery started to return { 'user/Cover': null } instead of just 'null'
  // for articles with no collection. This is a hack until we understand how to fix that.
  if (isEqual(article['user/Collection'], { 'user/Cover': null })) {
    delete article['user/Collection'];
  }

  const suggestedSecret = article[SUGGESTED_ARTICLES][DOC_SECRET_NAME];
  const localeBySecret = mapAppNameLocales(['Text']).reduce((acc, key) => {
    const secret = article[key][DOC_SECRET_NAME];
    acc[secret] = key;
    return acc;
  }, {});
  const secrets = mapSecrets(Object.keys(localeBySecret).concat(suggestedSecret));
  const docs = keyBy(await fibery.document.getBatch(secrets, DOC_FORMAT), 'secret');
  Object.entries(localeBySecret).forEach(([secret, key]) => {
    article[key] = getDoc(docs, secret);
  });
  const suggestedDoc = getDoc(docs, suggestedSecret);
  if (suggestedDoc) {
    article[SUGGESTED_ARTICLES] = await buildState(
      processDocumentConstructor(suggestedDoc.content)
    );
  } else {
    article[SUGGESTED_ARTICLES] = null;
  }

  const formatArticle = toWirFormat({
    mapping: {
      Podcast: 'audio',
      'Publication Time': 'publishAt',
      'Suggested Articles': 'suggestedArticles',
    },
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
        mapping: {
          'Apple Podcasts Track ID': 'episodeIds.applepodcasts',
          'Spotify Track ID': 'episodeIds.spotifypodcasts',
          'Yandex Music Track ID': 'episodeIds.yandexmusic',
          'YouTube Podcasts Track ID': 'episodeIds.youtubepodcasts',
        },
        formatters: {
          id: convertToString,
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

const getFortuneGame = async ({ fiberyPublicId }) => {
  const [rawFortuneGame] = await fibery.entity.query(
    {
      'q/from': addAppName('Fortune Collection'),
      'q/select': FIBERY_DEFAULT.concat(FORTUNE_COLLECTION_FIELDS),
      'q/where': ['=', 'fibery/public-id', '$id'],
      'q/limit': 1,
    },
    { $id: fiberyPublicId }
  );

  if (!rawFortuneGame) {
    throw new HttpError(HttpStatus.NOT_FOUND);
  }

  const fortuneGame = toWirFormat({
    mapping: {
      'Fortune Cookies': 'cookies',
      'Suggested articles': 'suggestedArticles',
    },
    formatters: {
      cookies: map(
        toWirFormat({
          mapping: {
            Text: 'text',
            Author: 'author',
            Personality: 'authorTag',
          },
          formatters: {
            authorTag: TAG_FORMATTER,
          },
        })
      ),
    },
  })(rawFortuneGame);

  const suggestedSecret = fortuneGame.suggestedArticles[DOC_SECRET_NAME];
  const descriptionSecret = fortuneGame.description[DOC_SECRET_NAME];
  const cookiesSecrets = fortuneGame.cookies.map(({ text }) => text[DOC_SECRET_NAME]);
  const secrets = mapSecrets([...cookiesSecrets, suggestedSecret, descriptionSecret]);
  const docs = keyBy(await fibery.document.getBatch(secrets, DOC_FORMAT), 'secret');
  fortuneGame.cookies.forEach((cookie, index) => {
    fortuneGame.cookies[index].text = getDoc(docs, cookie.text[DOC_SECRET_NAME]);
  });

  const suggestedDoc = getDoc(docs, suggestedSecret);
  if (suggestedDoc) {
    fortuneGame.suggestedArticles = await buildState(
      processDocumentConstructor(suggestedDoc.content)
    );
  } else {
    fortuneGame.suggestedArticles = null;
  }

  const descriptionDoc = getDoc(docs, descriptionSecret);
  fortuneGame.description = descriptionDoc ? descriptionDoc.content : null;

  return fortuneGame;
};

const getTinderGame = async ({ fiberyPublicId }) => {
  const [rawTinderGame] = await fibery.entity.query(
    {
      'q/from': addAppName('Tinder Game'),
      'q/select': FIBERY_DEFAULT.concat(TINDER_GAME_FIELDS),
      'q/where': ['=', 'fibery/public-id', '$id'],
      'q/limit': 1,
    },
    { $id: fiberyPublicId }
  );

  if (!rawTinderGame) {
    throw new HttpError(HttpStatus.NOT_FOUND);
  }

  const tinderGame = toWirFormat({
    mapping: {
      People: 'people',
      'Suggested Articles': 'suggestedArticles',
    },
    formatters: {
      people: map(
        toWirFormat({
          mapping: {
            'Tinder Nickname': 'nickname',
            Personality: 'personTag',
            description: 'description',
            'Accept Message': 'acceptMessage',
          },
          formatters: {
            personTag: TAG_FORMATTER,
            files: map(toWirFormat()),
          },
        })
      ),
    },
    ignore: ['description'],
  })(rawTinderGame);

  const suggestedSecret = tinderGame.suggestedArticles[DOC_SECRET_NAME];
  const peopleSecrets = tinderGame.people.map(({ description, acceptMessage }) => [
    description[DOC_SECRET_NAME],
    acceptMessage[DOC_SECRET_NAME],
  ]);
  const secrets = mapSecrets([...flatten(peopleSecrets), suggestedSecret]);
  const docs = keyBy(await fibery.document.getBatch(secrets, DOC_FORMAT), 'secret');
  tinderGame.people.forEach((person, index) => {
    tinderGame.people[index].description = getDoc(docs, person.description[DOC_SECRET_NAME]);
    tinderGame.people[index].acceptMessage = getDoc(docs, person.acceptMessage[DOC_SECRET_NAME]);
  });

  const suggestedDoc = getDoc(docs, suggestedSecret);
  if (suggestedDoc) {
    tinderGame.suggestedArticles = await buildState(
      processDocumentConstructor(suggestedDoc.content)
    );
  } else {
    tinderGame.suggestedArticles = null;
  }

  tinderGame.people.forEach(({ fiberyPublicId: personId, files }, index) => {
    if (files.length !== 1) {
      throw new ValidationError({
        people: {
          files: `each person must contain exactly one file attached, fiberyPublicId:${personId} does not`,
        },
      });
    }
    if (!files[0].name.match(/\.(jpg|jpeg|png)/)) {
      throw new ValidationError({
        people: {
          files: `file '${files[0].name}' is attached to person fiberyPublicId:${personId} does not match regex: bad image extension`,
        },
      });
    }
    tinderGame.people[index].photoUrl = getFileUrl(files[0].secret);
    delete tinderGame.people[index].files;
  });

  return tinderGame;
};

const getXYGame = async ({ fiberyPublicId }) => {
  const [rawXYGame] = await fibery.entity.query(
    {
      'q/from': addAppName('XY Game'),
      'q/select': FIBERY_DEFAULT.concat(XY_GAME_FIELDS),
      'q/where': ['=', 'fibery/public-id', '$id'],
      'q/limit': 1,
    },
    { $id: fiberyPublicId }
  );

  if (!rawXYGame) {
    throw new HttpError(HttpStatus.NOT_FOUND);
  }

  const xyGame = toWirFormat({
    mapping: {
      // Fields with localization suffixes are handled automatically.
      'Input Type': 'inputType',
      Color: 'color',
      'XY Game Outcomes': 'outcomes',
      'Suggested Articles': 'suggestedArticles',
    },
    formatters: {
      inputType: formatEnum,
      files: map(toWirFormat()),
      outcomes: map(
        toWirFormat({
          mapping: {
            Input: 'input',
            'Text-be': 'text.be',
          },
          formatters: {
            // For numeric inputs we allow leading zeros in Fibery for better string sorting.
            // TODO: Make this conditional on inputType, if more input types are supported.
            input: str => trimStart(str.trim(), '0'),
          },
        })
      ),
    },
  })(rawXYGame);

  const suggestedSecret = xyGame.suggestedArticles[DOC_SECRET_NAME];
  const outcomeSecrets = xyGame.outcomes.map(({ text: { be } }) => be[DOC_SECRET_NAME]);
  const secrets = mapSecrets([...outcomeSecrets, suggestedSecret]);
  const docs = keyBy(await fibery.document.getBatch(secrets, DOC_FORMAT), 'secret');
  xyGame.outcomes.forEach((outcome, index) => {
    xyGame.outcomes[index].text.be = getDoc(docs, outcome.text.be[DOC_SECRET_NAME]);
  });

  const suggestedDoc = getDoc(docs, suggestedSecret);
  if (suggestedDoc) {
    xyGame.suggestedArticles = await buildState(processDocumentConstructor(suggestedDoc.content));
  } else {
    xyGame.suggestedArticles = null;
  }

  const IMAGES_REGEX = /(left|right|bottom).*\.(jpg|jpeg|png)$/;
  xyGame.images = xyGame.files.reduce((acc, { secret, name }) => {
    const [_, type] = IMAGES_REGEX.exec(name) || [];
    if (type) {
      acc[type] = getFileUrl(secret);
    }
    return acc;
  }, {});
  delete xyGame.files;

  return xyGame;
};

const getStateConstructorDocument = async constructorId => {
  const [stateConstructor] = await fibery.entity.query(
    {
      'q/from': addAppName('State Constructor'),
      'q/select': FIBERY_DEFAULT.concat(STATE_CONSTRUCTOR_FIELDS),
      'q/where': ['=', addAppName('Constructor ID'), '$id'],
      'q/limit': 1,
    },
    { $id: constructorId }
  );

  if (!stateConstructor) {
    throw new HttpError(HttpStatus.NOT_FOUND);
  }

  const stateDocumentSecret = stateConstructor[addAppName('State')][DOC_SECRET_NAME];
  const rawStateDocument = JSON.parse(await fibery.document.get(stateDocumentSecret, DOC_FORMAT));
  if (!rawStateDocument) {
    throw new HttpError(HttpStatus.NOT_FOUND);
  }

  return processDocumentConstructor(rawStateDocument.content.doc.content);
};

export default {
  getArticleData,
  getDiaries,
  getFortuneGame,
  getTinderGame,
  getXYGame,
  getStateConstructorDocument,
};
