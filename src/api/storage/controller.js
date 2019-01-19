import { sendJson } from 'utils/api';

import { checkIsFound } from 'utils/validation';
import { MAIN_PAGE_KEY } from 'constants/storage';

import { Article } from 'api/article';
import { ArticleBrand } from 'api/article/brand';
import { Topic } from 'api/topic';

import { StorageEntity } from './model';

const MAIN_PAGE_ENTITIES = {
  articles: ({ query, user }) => Article.customQuery({ query, user }),
  brands: ({ query }) => ArticleBrand.customQuery({ query }),
  topics: () => Topic.getAll(),
};

export const getMainPage = ({ user }, res, next) =>
  StorageEntity.getValue(MAIN_PAGE_KEY)
    .then(checkIsFound)
    .then(obj => obj.document)
    .then(async ({ blocks, data }) => {
      const result = {
        blocks,
        data: {},
      };

      const promises = Object.entries(MAIN_PAGE_ENTITIES).map(([supportedEntity, queryFunction]) =>
        queryFunction({
          query: {
            _id: {
              $in: data[supportedEntity],
            },
          },
          user,
        }).then(obj => {
          result.data[supportedEntity] = obj;
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
        }).then(obj => {
          result.data.latestArticles = obj;
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
