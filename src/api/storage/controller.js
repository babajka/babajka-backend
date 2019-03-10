import { sendJson } from 'utils/api';

import { checkIsFound } from 'utils/validation';
import { MAIN_PAGE_KEY } from 'constants/storage';

import { Article } from 'api/article';
import { Tag } from 'api/tag';
import { Topic } from 'api/topic';

import { StorageEntity } from './model';

const MAIN_PAGE_ENTITIES_QUERIES = {
  articles: ({ query, user }) => Article.customQuery({ query, user }),
  tags: ({ query }) => Tag.customQuery({ query }),
  topics: () => Topic.getAll(),
};

export const getMainPage = ({ user }, res, next) =>
  StorageEntity.getValue(MAIN_PAGE_KEY)
    .then(checkIsFound)
    .then(entity => entity.document)
    .then(async ({ blocks, data }) => {
      const result = {
        blocks,
        data: {},
      };

      const promises = Object.entries(MAIN_PAGE_ENTITIES_QUERIES).map(
        ([supportedEntity, queryFunction]) =>
          queryFunction({
            query: {
              _id: {
                $in: data[supportedEntity],
              },
            },
            user,
          }).then(list => {
            result.data[supportedEntity] = list;
          })
      );

      promises.push(
        Article.customQuery({
          query: {
            active: true,
            locales: { $exists: true },
            publishAt: { $lt: Date.now() },
          },
          limit: 3,
          sort: { publishAt: 'desc' },
          user,
        }).then(list => {
          result.data.latestArticles = list;
        })
      );

      await Promise.all(promises);

      return result;
    })
    .then(sendJson(res))
    .catch(next);

export const setMainPage = ({ body, user }, res, next) =>
  StorageEntity.setValue(MAIN_PAGE_KEY, body, user._id)
    .then(entity => entity.document)
    .then(sendJson(res))
    .catch(next);
