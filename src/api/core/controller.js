import { sendJson } from 'utils/api';

import { uploadStream, getImages } from 'services/cloudinary';

const callback = (res, next) => (err, data) => {
  if (err) {
    return next(err);
  }
  return sendJson(res)(data);
};

export const upload = (req, res, next) => req.file.stream.pipe(uploadStream(callback(res, next)));

export const getUploads = (req, res, next) => {
  getImages(callback(res, next));
};
