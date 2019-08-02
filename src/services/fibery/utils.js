import { APP_NAME, LOCALES } from './constants';

export const flatMap = (arr, f) => arr.reduce((acc, cur) => acc.concat(f(cur)), []);

export const addAppName = key => `${APP_NAME}/${key}`;
export const mapAppName = fields => fields.map(addAppName);

export const appendLocale = key => lang => `${key}-${lang}`;
export const mapLocales = key => LOCALES.map(appendLocale(key));

export const mapAppNameLocales = arr => flatMap(mapAppName(arr), mapLocales);

// https://regex101.com/r/pBnzhy/1
const ARTICLE_URL_REGEX = /https:\/\/wir\.fibery\.io\/Content~Marketing\/[^/]+#Article\/(?:([\d]+)|(?:.+)-([\d]+))$/;
export const getArticlePublicId = url => {
  const match = url.match(ARTICLE_URL_REGEX);
  return match && (match[1] || match[2]);
};

export const getArticleBaseUrl = publicId =>
  `https://wir.fibery.io/Content~Marketing/Article/${publicId}`;
