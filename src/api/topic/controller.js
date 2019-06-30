import { sendJson } from 'utils/api';
import { checkIsFound } from 'utils/validation';

import { Topic } from 'api/topic';
import { Tag } from 'api/tag';
import { Article, queryUnpublished } from 'api/article';

export const getArticles = async ({ params: { topic: slug }, user }, res, next) => {
  try {
    const topic = await Topic.findOne({ slug });
    checkIsFound(topic);

    const tags = await Tag.find({ topic: topic._id });
    checkIsFound(tags);

    const tagsIds = tags.map(({ _id }) => _id.toString());
    const articles = await Article.customQuery({
      query: {
        $and: [
          {
            active: true,
            locales: { $exists: true },
            tags: { $in: tagsIds },
          },
          queryUnpublished(user),
        ],
      },
      sort: { publishAt: 'desc' },
    });
    checkIsFound(articles);
    const articlesByTag = articles.reduce((acc, cur) => {
      cur.tags.filter(({ _id }) => tagsIds.includes(_id.toString())).forEach(({ _id }) => {
        acc[_id] = acc[_id] || [];
        acc[_id].push(cur._id);
      });
      return acc;
    }, {});
    return sendJson(res)({ tags, topic, articles, articlesByTag });
  } catch (err) {
    return next(err);
  }
};
