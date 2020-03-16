import HttpError from 'node-http-error';
import HttpStatus from 'http-status-codes';

import { Article } from 'api/article';
import { Tag } from 'api/tag';

const handleBlock = (type, params, entities, transformArticleId, transformTagId) => {
  const articlesByTagHandler = () => ({
    type,
    tagId: transformTagId(params[0]),
    articlesIds: entities.map(aId => transformArticleId(aId)),
  });

  const handlers = {
    // DIARY
    diary: () => ({ type }),
    // BANNER
    banner: () => ({ type, banner: params }),
    // FEATURED
    featured: () => {
      if (!params.includes('frozen')) {
        return {
          type,
          frozen: false,
        };
      }
      return {
        type,
        frozen: true,
        articleId: transformArticleId(entities[0]),
      };
    },
    // LATEST_ARTICLES
    latestArticles: () => {
      const data = [];

      if (params.includes('frozen1')) {
        data.push({ frozen: true, articleId: transformArticleId(entities[0]) });
      } else {
        data.push({ frozen: false });
      }

      if (params.includes('frozen2')) {
        data.push({
          frozen: true,
          articleId: transformArticleId(entities[params.includes('frozen1') ? 1 : 0]),
        });
      } else {
        data.push({ frozen: false });
      }

      return { type, articlesIds: data };
    },
    // TAGS_BY_TOPIC
    tagsByTopic: () => {
      const block = { type };

      if (params.includes('locations')) {
        block.topicSlug = 'locations';
      } else if (params.includes('personalities')) {
        block.topicSlug = 'personalities';
      } else {
        throw new Error(`invalid tagsByTopic parameter: ${params}`);
      }
      if (params.includes('1-2')) {
        block.style = '1-2';
      } else {
        block.style = '2-1';
      }

      block.tagsIds = entities.map(fId => transformTagId(fId));

      return block;
    },
    // ARTICLES_BY_TAG
    articlesByTag2: articlesByTagHandler,
    articlesByTag3: articlesByTagHandler,
    // TAG_LIST (SIDEBAR)
    tagList: () => ({
      topic: params,
      tags: entities.map(tagId => transformTagId(tagId)),
    }),
  };

  return handlers[type]();
};

const buildMap = (Model, query = {}) =>
  Model.find(query)
    .select('_id fiberyId')
    .then(dbData =>
      dbData.reduce((acc, { _id, fiberyId }) => {
        acc[fiberyId] = _id;
        return acc;
      }, {})
    );

// Method handles both MainPageState and SidebarState.
export const buildState = async fiberyData => {
  const state = {
    blocks: {},
    data: {},
  };

  const articlesSet = new Set();
  const tagsSet = new Set();

  const articlesMap = await buildMap(Article, { publishAt: { $lt: Date.now() } });
  const tagsMap = await buildMap(Tag);

  const transformArticleId = fiberyId => {
    const id = articlesMap[fiberyId];
    if (id) {
      articlesSet.add(id);
      return id;
    }
    throw new HttpError(HttpStatus.NOT_FOUND, `no published article with fiberyId: ${fiberyId}`);
  };

  const transformTagId = fiberyId => {
    const id = tagsMap[fiberyId];
    if (id) {
      tagsSet.add(id);
      return id;
    }
    throw new HttpError(HttpStatus.NOT_FOUND, `no tag in database with fiberyId: ${fiberyId}`);
  };

  state.blocks = fiberyData.map(({ type, params, entities }) =>
    handleBlock(type, params, entities, transformArticleId, transformTagId)
  );

  state.data.articles = [...articlesSet];
  state.data.tags = [...tagsSet];

  return state;
};
