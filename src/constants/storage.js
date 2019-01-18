import Joi from 'joi';
import joiObjectId from 'joi-objectid';

Joi.objectId = joiObjectId(Joi);

export const MAIN_PAGE_KEY = 'main-page-key';

// TODO: to add 'tags', 'topics', 'banners', 'diary'.
export const MAIN_PAGE_ENTITIES = ['articles', 'brands'];

export const MAIN_PAGE_DATA_SCHEMA = Joi.object().pattern(
  Joi.string().valid(MAIN_PAGE_ENTITIES),
  Joi.array().items(Joi.objectId())
);
