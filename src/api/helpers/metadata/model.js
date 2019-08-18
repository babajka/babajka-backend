import mongoose from 'mongoose';

import Joi, { joiToMongoose } from 'utils/joi';
import { getSchema } from 'utils/joi/metadata';

// TODO: replace with `Joi.metadata`
// ObjectMetadataSchema model is a general-purpose object to be used across the project.
const ObjectMetadataSchema = joiToMongoose(getSchema(Joi));

export const ObjectMetadata = mongoose.model('ObjectMetadata', ObjectMetadataSchema);

export const getInitObjectMetadata = ({ _id }) => ({
  createdAt: Date.now(),
  createdBy: _id,
  updatedAt: Date.now(),
  updatedBy: _id,
});

export const updateObjectMetadata = (oldMetadata, { _id }) => ({
  ...oldMetadata,
  updatedAt: Date.now(),
  updatedBy: _id,
});

export const mergeWithUpdateMetadata = (data, { _id }) => ({
  $set: {
    ...data,
    'metadata.updatedBy': _id,
    'metadata.updatedAt': Date.now(),
  },
});
