import { Article } from 'api/article';
import { Tag } from 'api/tag';

const handleBlock = (type, params, entities, articlesMap, tagsMap, appendArticle, appendTag) => {
  // FEATURED
  if (type === 'featured') {
    if (!params.includes('frozen')) {
      return {
        type,
        frozen: false,
      };
    }
    const id = articlesMap[entities[0]];
    appendArticle(id);
    return {
      type,
      frozen: true,
      articleId: id,
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
      const id = articlesMap[entities[0]];
      appendArticle(id);
      data.push({ frozen: true, articleId: id });
    } else {
      data.push({ frozen: false });
    }

    if (params.includes('frozen2')) {
      const id = articlesMap[entities[params.includes('frozen1') ? 1 : 0]];
      appendArticle(id);
      data.push({ frozen: true, articleId: id });
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

    const tagsIds = entities.map(fId => {
      const id = tagsMap[fId];
      appendTag(id);
      return id;
    });
    block.tagsIds = tagsIds;

    return block;
  }
  // ARTICLES_BY_TAG_2_3
  if (type === 'articlesByTag2' || type === 'articlesByTag3') {
    const block = { type };

    const tagId = tagsMap[params[0]];
    block.tagId = tagId;
    appendTag(tagId);

    block.articlesIds = entities.map(aId => {
      const id = articlesMap[aId];
      appendArticle(id);
      return id;
    });

    return block;
  }
  // TAG_LIST (SIDEBAR)
  if (type === 'tagList') {
    return {
      topic: params,
      tags: entities.map(tagId => {
        const id = tagsMap[tagId];
        appendTag(id);
        return id;
      }),
    };
  }

  return null;
};

const buildMap = Model =>
  Model.find({})
    .select('_id fiberyId')
    .then(dbData =>
      dbData.reduce((acc, { _id, fiberyId }) => {
        acc[fiberyId] = _id;
        return acc;
      }, {})
    );

export const buildState = async fiberyData => {
  // Method handles both MainPageState and SidebarState.
  const state = {
    blocks: {},
    data: {
      articles: [],
      tags: [],
    },
  };

  const articlesMap = await buildMap(Article);
  const tagsMap = await buildMap(Tag);

  state.blocks = fiberyData.map(({ type, params, entities }) =>
    handleBlock(
      type,
      params,
      entities,
      articlesMap,
      tagsMap,
      id => state.data.articles.push(id),
      id => state.data.tags.push(id)
    )
  );

  state.data.articles = [...new Set(state.data.articles)];
  state.data.tags = [...new Set(state.data.tags)];

  return state;
};
