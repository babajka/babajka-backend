import mongoose from 'mongoose';

const { Schema } = mongoose;

// ObjectMetadataSchema model is a general-purpose object to be used across the project.
const ObjectMetadataSchema = new Schema({
  createdAt: {
    type: Date,
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedAt: {
    type: Date,
    required: true,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

export const ObjectMetadata = mongoose.model('ObjectMetadata', ObjectMetadataSchema);

export const getInitObjectMetadata = user => ({
  createdAt: Date.now(),
  createdBy: user._id,
  updatedAt: Date.now(),
  updatedBy: user._id,
});

export const updateObjectMetadata = (oldMetadata, user) => ({
  ...oldMetadata,
  updatedAt: Date.now(),
  updatedBy: user._id,
});

export const mergeWithUpdateMetadata = (data, userId) => ({
  $set: {
    ...data,
    'metadata.updatedBy': userId,
    'metadata.updatedAt': Date.now(),
  },
});
