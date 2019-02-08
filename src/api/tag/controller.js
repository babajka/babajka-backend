import { sendJson } from 'utils/api';
import { checkIsFound } from 'utils/validation';

import { Topic } from 'api/topic';
import { Article, queryUnpublished } from 'api/article';

import Tag from './model';

export const getByTopic = ({ params: { topic } }, res, next) =>
  Topic.findOne({ slug: topic })
    .then(checkIsFound)
    .then(({ _id }) =>
      Tag.customQuery({
        query: { topic: _id },
      })
    )
    .then(checkIsFound)
    .then(sendJson(res))
    .catch(next);

export const getArticles = ({ params: { tag }, user }, res, next) =>
  Tag.findOne({ slug: tag })
    .then(checkIsFound)
    .then(({ _id }) =>
      Article.customQuery({
        query: {
          $and: [
            {
              active: true,
              locales: { $exists: true },
              tags: { $elemMatch: { $eq: _id } },
            },
            queryUnpublished(user),
          ],
        },
        sort: { publishAt: 'desc' },
      })
    )
    .then(checkIsFound)
    .then(sendJson(res))
    .catch(next);
