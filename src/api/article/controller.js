import fibery from 'services/fibery';
import rss from 'services/rss';
import { updateTags } from 'api/tag/utils';
import { checkIsFound, isValidId } from 'utils/validation';
import { sendJson } from 'utils/api';
import { getId } from 'utils/getters';
import { getInitObjectMetadata } from 'api/helpers/metadata';

import _ from 'lodash';
import { writeFile } from 'fs/promises';

import Article, { DEFAULT_ARTICLE_QUERY, populateWithSuggestedState } from './article.model';
import LocalizedArticle from './localized/model';
import { updateLocales } from './localized/utils';
import { updateCollection } from './collection/utils';
import { mapFiberyArticle, getArticle, fetchAudio } from './utils';

export const getAll = ({ query: { skip, take }, user }, res, next) =>
  Article.customQuery({
    query: DEFAULT_ARTICLE_QUERY(user),
    user,
    sort: { publishAt: 'desc' },
    skip: parseInt(skip) || 0, // eslint-disable-line radix
    // A limit() value of 0 is equivalent to setting no limit.
    limit: parseInt(take) || 0, // eslint-disable-line radix
    populateContent: false,
  })
    .then(async data => ({
      data,
      total: await Article.find(DEFAULT_ARTICLE_QUERY(user)).countDocuments(),
    }))
    .then(sendJson(res))
    .catch(next);

const retrieveArticleId = (slugOrId, options) =>
  LocalizedArticle.findOne({ slug: slugOrId, ...options })
    .then(result => (result && result.articleId) || (isValidId(slugOrId) && slugOrId))
    .then(checkIsFound);

const convertContent = (content, { useBreak = false } = {}, init = '') => {
  if (!Array.isArray(content)) {
    return init;
  }
  return content.reduce((acc, { type, ...params }) => {
    // eslint-disable-next-line no-use-before-define
    const convert = CONVERTERS[type];
    if (!convert) {
      return acc;
    }
    return `${acc}${convert(params, { useBreak })}`;
  }, init);
};

const CONVERTERS = {
  paragraph: ({ content }, { useBreak }) =>
    `${convertContent(content, { useBreak })}${useBreak ? '\n' : ''}`,
  text: ({ text }) => text,
};

const getArticleById = (_id, user) =>
  Article.customQuery({
    query: { _id, active: true },
    user,
    limit: 1,
    populateSuggestions: true,
  }).then(articles => articles[0]);

export const getOne = ({ params: { slugOrId }, user }, res, next) =>
  retrieveArticleId(slugOrId, { active: true })
    .then(artId => getArticleById(artId, user))
    .then(checkIsFound)
    // FIXME: publishAt check
    // .then(article => checkIsPublished(article, user))
    .then(sendJson(res))
    .catch(next);

export const exportToTxt = ({ query: { skip, take }, user }, res, next) =>
  Article.customQuery({
    query: DEFAULT_ARTICLE_QUERY(user),
    user,
    sort: { publishAt: 'desc' },
    skip: parseInt(skip) || 0, // eslint-disable-line radix
    // A limit() value of 0 is equivalent to setting no limit.
    limit: parseInt(take) || 0, // eslint-disable-line radix
    populateContent: true,
  })
    .then(async data => {
      const tt = data.reduce((acc, article) => {
        const k1 = _.get(article, 'locales.be');
        if (!k1) {
          return '';
        }
        const k = _.get(k1, 'text.content');
        const content = k ? convertContent(k, { useBreak: true }) : '';
        return `${acc}\n\n${k1.title}\n\n${k1.subtitle}\n\n${content}`;
      }, '');
      console.log('tt', tt);
      // const promise = writeFile('message.txt', tt);
      // await promise;
      return tt;
    })
    .then(data => {
      res.set({ 'Content-Disposition': `attachment; filename="test.txt"` });
      res.send(data);
      return res;
    })
    .catch(next);

export const fiberyPreview = async ({ body: { url, fiberyPublicId }, user }, res, next) => {
  try {
    const data = await fibery.getArticleData({ url, fiberyPublicId });
    const article = await mapFiberyArticle(data).then(populateWithSuggestedState(user));
    if (article.collection) {
      article.collection.articles = [];
      article.collection.articleIndex = 0;
    }
    return sendJson(res)({ article });
  } catch (err) {
    return next(err);
  }
};

// import data from fibery.io
// update or create: Article, LocalizedArticles, Tags & Collection
// TODO: handle remove
export const fiberyImport = async ({ body: { url, fiberyPublicId }, user }, res, next) => {
  try {
    const rawArticle = await fibery.getArticleData({ url, fiberyPublicId });
    const data = await mapFiberyArticle(rawArticle);

    data.audio = await fetchAudio(data);

    // FIXME: metadata.createdAt everytime new
    const metadata = getInitObjectMetadata(user);
    const { tags, locales, collection, ...rest } = data;

    const article = await getArticle({ ...rest, metadata });
    await article.validate();
    await article.save();
    const id = getId(article);

    article.tags = await updateTags(tags, metadata);
    article.locales = await updateLocales(locales, metadata, id);
    if (collection) {
      article.collectionId = await updateCollection(collection, id);
    }

    await article.save();
    await rss.saveArticlesFeed(await rss.generateArticlesFeed());
    await rss.savePodcastsFeed(await rss.generatePodcastsFeed());
    return getArticleById(id, user)
      .then(sendJson(res))
      .catch(next);
  } catch (err) {
    // clean up db from inconsistent data
    await Article.deleteMany({ locales: { $size: 0 } });
    return next(err);
  }
};
