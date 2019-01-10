import isEmpty from 'lodash/isEmpty';

import { sendJson } from 'utils/api';

import { checkIsFound } from 'utils/validation';
import { getInitObjectMetadata, mergeWithUpdateMetadata } from 'api/helpers/metadata';

import { StorageEntity } from './model';

const getStorageEntity = (key, accessPolicy) =>
  StorageEntity.findOne({ key, accessPolicy })
    .then(checkIsFound)
    .then(obj => obj.document);

export const getPublicDocument = ({ params: { key } }, res, next) =>
  getStorageEntity(key, 'public')
    .then(sendJson(res))
    .catch(next);

export const getProtectedDocument = ({ params: { key } }, res, next) =>
  getStorageEntity(key, 'protected')
    .then(sendJson(res))
    .catch(next);

export const updateDocument = ({ params: { accessPolicy, key }, body, user }, res, next) => {
  const fieldsToUpdate = { accessPolicy };
  if (!isEmpty(body)) {
    fieldsToUpdate.document = body;
  }

  return StorageEntity.findOneAndUpdate(
    { key },
    mergeWithUpdateMetadata(fieldsToUpdate, user._id),
    {
      new: true,
    }
  )
    .then(
      entity =>
        entity ||
        StorageEntity({
          accessPolicy,
          key,
          document: body,
          metadata: getInitObjectMetadata(user),
        }).save()
    )
    .then(entity => entity.document)
    .then(sendJson(res))
    .catch(next);
};
