import isEmpty from 'lodash/isEmpty';

import { defaultValidator, ValidationError } from 'utils/joi';
import { getId } from 'utils/getters';

import ArticleCollection, { joiArticleCollectionSchema } from './model';

const validate = data => {
  const errors = defaultValidator(data, joiArticleCollectionSchema);
  if (!isEmpty(errors)) {
    throw new ValidationError({ collection: { errors, data } });
  }
};

export const updateCollection = async (data, articleId) => {
  validate(data);
  const { fiberyId } = data;
  const collection = await ArticleCollection.findOneAndUpdate({ fiberyId }, data, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
    runValidators: true,
  });
  if (!collection.articles.includes(articleId)) {
    // FIXME: handle articles order
    collection.articles.push(articleId);
    await collection.save();
  }
  return getId(collection);
};
