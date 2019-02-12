import config from 'config';

const cloudinary = require('cloudinary').v2;

const { apiKey, apiSecret, folder, cloudName } = config.services.cloudinary;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

const UPLOAD_OPTIONS = { folder, tags: ['api_upload'] };
const uploadStream = cloudinary.uploader.upload_stream.bind(null, UPLOAD_OPTIONS);

const GET_OPTIONS = { type: 'upload', prefix: folder };
const getImages = cloudinary.api.resources.bind(null, GET_OPTIONS);

export { uploadStream, getImages };
