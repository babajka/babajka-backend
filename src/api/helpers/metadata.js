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
    'metadata.updatedAt': Date.now(),
    'metadata.updatedBy': _id,
  },
});
