import mongoose from 'mongoose';

import {
  joiMetadataSchema,
  getInitObjectMetadata,
  mergeWithUpdateMetadata,
} from 'api/helpers/metadata';
import Joi, { joiToMongoose } from 'utils/joi';

const joiStorageEntitySchema = Joi.object({
  key: Joi.string()
    .required()
    .meta({ unique: true }),
  document: Joi.object().required(),
  accessPolicy: Joi.string()
    .valid('public')
    .default('public'),
  metadata: joiMetadataSchema.required(),
});

const StorageEntitySchema = joiToMongoose(joiStorageEntitySchema);

StorageEntitySchema.statics.getValue = function(key) {
  return this.findOne({ key });
};

StorageEntitySchema.statics.setValue = function(key, value, _id) {
  return this.findOneAndUpdate({ key }, mergeWithUpdateMetadata({ document: value }, { _id }), {
    new: true,
  }).then(
    entity =>
      entity ||
      this({
        key,
        document: value,
        metadata: getInitObjectMetadata({ _id }),
      }).save()
  );
};

export const StorageEntity = mongoose.model('StorageEntity', StorageEntitySchema);
