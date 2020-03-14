import pick from 'lodash/pick';

import fibery from 'services/fibery';

import { sendJson } from 'utils/api';

import { checkIsFound } from 'utils/validation';
import { MAIN_PAGE_KEY, SIDEBAR_KEY } from 'constants/storage';

import { Article } from 'api/article';
import { Tag } from 'api/tag';
import { Topic } from 'api/topic';

import { StorageEntity } from './model';
import { buildState } from './stateConstructors';

const MAIN_PAGE_ENTITIES_QUERIES = {
  articles: ({ query, user }) => Article.customQuery({ query, user }),
  tags: ({ query }) => Tag.customQuery({ query }),
  topics: () => Topic.getAll(),
};

const SIDEBAR_ENTITIES_QUERIES = pick(MAIN_PAGE_ENTITIES_QUERIES, ['tags']);

const getState = ({ user, storageKey, entitiesQueries, includeLatestArticles = false }) =>
  StorageEntity.getValue(storageKey)
    .then(checkIsFound)
    .then(entity => entity.document)
    .then(async ({ blocks, data }) => {
      const result = {
        blocks,
        data: {},
      };

      const promises = Object.entries(entitiesQueries).map(([supportedEntity, queryFunction]) =>
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

      if (includeLatestArticles) {
        promises.push(
          Article.customQuery({
            query: {
              active: true,
              locales: { $exists: true },
              // FIXME:
              // publishAt: { $lt: Date.now() },
            },
            limit: 3,
            sort: { publishAt: 'desc' },
            user,
          }).then(list => {
            result.data.latestArticles = list;
          })
        );
      }

      await Promise.all(promises);

      return result;
    });

export const getSidebar = ({ user }, res, next) =>
  getState({
    user,
    storageKey: SIDEBAR_KEY,
    entitiesQueries: SIDEBAR_ENTITIES_QUERIES,
    includeLatestArticles: false,
  })
    .then(sendJson(res))
    .catch(next);

export const getMainPage = ({ user }, res, next) =>
  getState({
    user,
    storageKey: MAIN_PAGE_KEY,
    entitiesQueries: MAIN_PAGE_ENTITIES_QUERIES,
    includeLatestArticles: true,
  })
    .then(sendJson(res))
    .catch(next);

export const setMainPage = ({ body, user }, res, next) =>
  StorageEntity.setValue(MAIN_PAGE_KEY, body, user._id)
    .then(entity => entity.document)
    .then(sendJson(res))
    .catch(next);

export const setSidebar = ({ body, user }, res, next) =>
  StorageEntity.setValue(SIDEBAR_KEY, body, user._id)
    .then(entity => entity.document)
    .then(sendJson(res))
    .catch(next);

export const fiberyMainPage = async ({ user }, res, next) => {
  try {
    const fiberyData = await fibery.getMainPageState();
    const mainPageState = await buildState(fiberyData);
    const { document } = await StorageEntity.setValue(MAIN_PAGE_KEY, mainPageState, user._id);
    return sendJson(res)(document);
  } catch (err) {
    return next(err);
  }
};

export const fiberySidebar = async ({ user }, res, next) => {
  try {
    const fiberyData = await fibery.getSidebarState();
    const sidebarState = await buildState(fiberyData);
    const { document } = await StorageEntity.setValue(SIDEBAR_KEY, sidebarState, user._id);
    return sendJson(res)(document);
  } catch (err) {
    return next(err);
  }
};
