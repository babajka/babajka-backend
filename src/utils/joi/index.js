import mongoose from 'mongoose';
import baseJoi from '@hapi/joi';
import getJoigoose from 'joigoose';
import set from 'lodash/set';
import omit from 'lodash/omit';

import { ValidationError } from 'utils/validation';

import objectid from './objectId';
import color from './color';
import userRef from './userRef';
import localizedText from './localizedText';
import colloquialDateHash from './colloquialDateHash';
import metadata from './metadata';
import image from './image';
import slug from './slug';
import locale from './locale';
import userPermissions from './userPermissions';

const Joi = baseJoi.extend([
  objectid,
  color,
  userRef,
  localizedText,
  colloquialDateHash,
  metadata,
  image,
  slug,
  locale,
  userPermissions,
]);

const Joigoose = getJoigoose(mongoose);
const joiToMongoose = (joiModel, options) => {
  const schema = new mongoose.Schema(Joigoose.convert(joiModel), options);

  schema.pre('validate', function(next) {
    const { error } = Joi.validate(omit(this._doc, ['_id', '__v']), joiModel, {
      abortEarly: false,
    });
    if (error === null) {
      return next();
    }

    const errors = error.details.reduce((acc, { path, type }) => set(acc, path, type), {});
    return next(new ValidationError(errors));
  });

  return schema;
};

export { joiToMongoose };
export default Joi;
