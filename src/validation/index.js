import mongoose from 'mongoose';
import Joi from 'joi';
import joiObjectId from 'joi-objectid';
import getJoigoose from 'joigoose';

import joiSchemas from './schemas';

Joi.objectId = joiObjectId(Joi);

const Joigoose = getJoigoose(mongoose);
const joiToMongoose = (model, options) => new mongoose.Schema(Joigoose.convert(model), options);

export { Joi, joiToMongoose, joiSchemas };
