import mongoose from 'mongoose';

import { ObjectMetadata } from 'api/helpers/metadata';

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
    enum: ['public', 'protected'],
    required: true,
  },
  metadata: {
    type: ObjectMetadata.schema,
    required: true,
  },
});

export const StorageEntity = mongoose.model('StorageEntity', StorageEntitySchema);
