import mongoose from 'mongoose';
import baseJoi from '@hapi/joi';
import getJoigoose from 'joigoose';
import HttpError from 'node-http-error';
import HttpStatus from 'http-status-codes';
import omit from 'lodash/omit';
import set from 'lodash/set';

import objectid from './objectId';
import color from './color';
import theme from './theme';
import userRef from './userRef';
import localizedText from './localizedText';
import colloquialDateHash from './colloquialDateHash';
import metadata from './metadata';
import image from './image';
import slug from './slug';
import locale from './locale';
import userPermissions from './userPermissions';

export function ValidationError(message) {
  return HttpError(HttpStatus.BAD_REQUEST, message);
}

const Joi = baseJoi.extend([
  objectid,
  color,
  theme,
  userRef,
  localizedText,
  colloquialDateHash,
  metadata,
  image,
  slug,
  locale,
  userPermissions,
]);

export const defaultValidator = (data, schema) => {
  const { error } = Joi.validate(omit(data, ['_id', '__v']), schema, {
    abortEarly: false,
  });
  return (
    error &&
    error.details.reduce(
      (acc, { path, type, message }) => set(acc, path.join('.') || 'index', { type, message }),
      {}
    )
  );
};

const Joigoose = getJoigoose(mongoose);
const joiToMongoose = (joiModel, options, validator = defaultValidator) => {
  const schema = new mongoose.Schema(Joigoose.convert(joiModel), options);

  schema.pre('validate', function(next) {
    const errors = validator(this.toObject({ virtuals: false }), joiModel);
    return next(errors && new ValidationError(errors));
  });

  return schema;
};

export { joiToMongoose };
export default Joi;
