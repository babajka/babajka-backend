import mongoose from 'mongoose';
import baseJoi from '@hapi/joi';
import getJoigoose from 'joigoose';

import objectid from './objectId';
import color from './color';
import userRef from './userRef';
import localizedText from './localizedText';
import colloquialDateHash from './colloquialDateHash';

const Joi = baseJoi
  .extend(objectid)
  .extend(color)
  .extend(userRef)
  .extend(localizedText)
  .extend(colloquialDateHash);

const Joigoose = getJoigoose(mongoose);
const joiToMongoose = (model, options) => new mongoose.Schema(Joigoose.convert(model), options);

export { joiToMongoose };
export default Joi;
