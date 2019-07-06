import { sendJson } from 'utils/api';
import { checkIsFound } from 'utils/validation';

import { Topic } from 'api/topic';
import { Article, queryUnpublished } from 'api/article';

import Tag from './model';

export const getByTopic = ({ params: { topic: slug } }, res, next) =>
  Topic.findOne({ slug })
    .then(checkIsFound)
    .then(({ _id }) => Tag.customQuery({ query: { topic: _id } }))
    .then(checkIsFound)
    .then(sendJson(res))
    .catch(next);

export const getArticles = async ({ params: { tag: slug }, user }, res, next) => {
  try {
    const tag = await Tag.findOne({ slug }).populate('topic');
    checkIsFound(tag);

    const articles = await Article.customQuery({
      query: {
        $and: [
          {
            active: true,
            locales: { $exists: true },
            tags: { $elemMatch: { $eq: tag._id } },
          },
          queryUnpublished(user),
        ],
      },
      sort: { publishAt: 'desc' },
    });
    checkIsFound(articles);

    return sendJson(res)({ tag, articles });
  } catch (err) {
    return next(err);
  }
};
