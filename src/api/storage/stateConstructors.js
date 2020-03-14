import { Article } from 'api/article';
import { Tag } from 'api/tag';

const handleBlock = (type, params, entities, getArticleId, getTagId) => {
  // FEATURED
  if (type === 'featured') {
    if (!params.includes('frozen')) {
      return {
        type,
        frozen: false,
      };
    }
    return {
      type,
      frozen: true,
      articleId: getArticleId(entities[0]),
    };
  }
  // DIARY
  if (type === 'diary') {
    return { type };
  }
  // BANNER
  if (type === 'banner') {
    return { type, banner: params };
  }
  // LATEST_ARTICLES
  if (type === 'latestArticles') {
    const data = [];

    if (params.includes('frozen1')) {
      data.push({ frozen: true, articleId: getArticleId(entities[0]) });
    } else {
      data.push({ frozen: false });
    }

    if (params.includes('frozen2')) {
      data.push({
        frozen: true,
        articleId: getArticleId(entities[params.includes('frozen1') ? 1 : 0]),
      });
    } else {
      data.push({ frozen: false });
    }

    return { type, articlesIds: data };
  }
  // TAGS_BY_TOPIC
  if (type === 'tagsByTopic') {
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

    block.tagsIds = entities.map(fId => getTagId(fId));

    return block;
  }
  // ARTICLES_BY_TAG_2_3
  if (type === 'articlesByTag2' || type === 'articlesByTag3') {
    return {
      type,
      tagId: getTagId(params[0]),
      articlesIds: entities.map(aId => getArticleId(aId)),
    };
  }
  // TAG_LIST (SIDEBAR)
  if (type === 'tagList') {
    return {
      topic: params,
      tags: entities.map(tagId => getTagId(tagId)),
    };
  }

  return null;
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

  const getArticleId = fiberyId => {
    const id = articlesMap[fiberyId];
    if (id) {
      articlesSet.add(id);
      return id;
    }
    throw new Error(`no published article with fiberyId: ${fiberyId}`);
  };

  const getTagId = fiberyId => {
    const id = tagsMap[fiberyId];
    if (id) {
      tagsSet.add(id);
      return id;
    }
    throw new Error(`no tag in database with fiberyId: ${fiberyId}`);
  };

  state.blocks = fiberyData.map(({ type, params, entities }) =>
    handleBlock(type, params, entities, getArticleId, getTagId)
  );

  state.data.articles = [...articlesSet];
  state.data.tags = [...tagsSet];

  return state;
};
