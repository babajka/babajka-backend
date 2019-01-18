import mongoose from 'mongoose';

import {
  ObjectMetadata,
  getInitObjectMetadata,
  mergeWithUpdateMetadata,
} from 'api/helpers/metadata';

const { Schema } = mongoose;

const StorageEntitySchema = new Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  document: {
    type: Schema.Types.Mixed,
    required: true,
  },
  accessPolicy: {
    type: String,
    enum: ['public'],
    default: 'public',
    required: true,
  },
  metadata: {
    type: ObjectMetadata.schema,
    required: true,
  },
});

// eslint-disable-next-line func-names
StorageEntitySchema.statics.getValue = function(key) {
  return this.findOne({ key });
};

// eslint-disable-next-line func-names
StorageEntitySchema.statics.setValue = function(key, value, userId) {
  return this.findOneAndUpdate({ key }, mergeWithUpdateMetadata({ document: value }, userId), {
    new: true,
  }).then(
    entity =>
      entity ||
      this({
        key,
        document: value,
        metadata: getInitObjectMetadata(userId),
      }).save()
  );
};

export const StorageEntity = mongoose.model('StorageEntity', StorageEntitySchema);
