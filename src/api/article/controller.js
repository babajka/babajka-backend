import fibery from 'services/fibery';
import rss from 'services/rss';
import { updateTags } from 'api/tag/utils';
import { checkIsFound, isValidId } from 'utils/validation';
import { sendJson } from 'utils/api';
import { getId } from 'utils/getters';
import { getInitObjectMetadata } from 'api/helpers/metadata';

import Article, { DEFAULT_ARTICLE_QUERY, populateWithSuggestedState } from './article.model';
import LocalizedArticle from './localized/model';
import { updateLocales } from './localized/utils';
import { updateCollection } from './collection/utils';
import { mapFiberyArticle, getArticle, fetchAudio } from './utils';

export const getAll = ({ range: { skip, limit }, user }, res, next) =>
  Article.customQuery({
    query: DEFAULT_ARTICLE_QUERY(user),
    user,
    sort: { publishAt: 'desc' },
    skip,
    limit,
    populateContent: false,
  })
    .then(async data => {
      const length = await Article.find(DEFAULT_ARTICLE_QUERY(user)).countDocuments();
      return sendJson(res, { range: { length } })(data);
    })
    .catch(next);

const retrieveArticleId = (slugOrId, options) =>
  LocalizedArticle.findOne({ slug: slugOrId, ...options })
    .then(result => (result && result.articleId) || (isValidId(slugOrId) && slugOrId))
    .then(checkIsFound);

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
