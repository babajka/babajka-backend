import { sendJson } from 'utils/api';
import { checkIsFound } from 'utils/validation';

import { Topic } from 'api/topic';
import { Tag } from 'api/tag';
import { Article, queryUnpublished } from 'api/article';

import { mapIds, getArticlesByTag } from 'utils/getters';

export const getArticles = async ({ params: { topic: slug }, user }, res, next) => {
  try {
    const topic = await Topic.findOne({ slug });
    checkIsFound(topic);

    const tags = await Tag.find({ topic: topic._id });
    checkIsFound(tags);

    const articles = await Article.customQuery({
      query: {
        $and: [
          {
            active: true,
            locales: { $exists: true },
            tags: { $in: mapIds(tags) },
          },
          queryUnpublished(user),
        ],
      },
      sort: { publishAt: 'desc' },
    });
    checkIsFound(articles);
    const articlesByTag = getArticlesByTag({ articles });
    return sendJson(res)({ tags, topic, articles, articlesByTag });
  } catch (err) {
    return next(err);
  }
};
