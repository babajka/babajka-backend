import { sendJson } from 'utils/api';

import { checkIsFound } from 'utils/validation';
import { mainPageKey } from 'constants/storage';

import { Article } from 'api/article';
import { serializeArticle, POPULATE_OPTIONS } from 'api/article/article.model';
import { ArticleBrand } from 'api/article/brand';

import { StorageEntity } from './model';

// TODO: to sync calls in this dict with the similar calls in controllers.
const mainPageEntities = {
  articles: ({ query, user }) =>
    Article.find(query)
      .populate('author', POPULATE_OPTIONS.author)
      .populate('brand', POPULATE_OPTIONS.brand)
      .populate(POPULATE_OPTIONS.collection(user))
      .populate(POPULATE_OPTIONS.locales)
      .populate(POPULATE_OPTIONS.metadata)
      .then(articles => articles.map(serializeArticle)),
  brands: ({ query }) => ArticleBrand.find(query).select('-__v'),
};

export const getMainPage = ({ user }, res, next) =>
  StorageEntity.getValue(mainPageKey)
    .then(checkIsFound)
    .then(obj => obj.document)
    .then(async document => {
      const result = {
        blocks: document.blocks,
        data: {},
      };

      await Promise.all(
        Object.keys(mainPageEntities).map(supportedEntity =>
          mainPageEntities[supportedEntity]({
            query: {
              _id: {
                $in: document.data[supportedEntity],
              },
            },
            user,
          }).then(obj => {
            result.data[supportedEntity] = obj;
          })
        )
      );

      return result;
    })
    .then(sendJson(res))
    .catch(next);

export const setMainPage = ({ body, user }, res, next) =>
  StorageEntity.setValue(mainPageKey, body, user._id)
    .then(entity => entity.document)
    .then(sendJson(res))
    .catch(next);
