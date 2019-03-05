import Joi from 'joi';
import joiObjectId from 'joi-objectid';

Joi.objectId = joiObjectId(Joi);

export const MAIN_PAGE_KEY = 'main-page-key';

// This is a list of Main Page Entities to be accepted by setMainPage() method.
// Note: 'topics' are not accepted; get method always returns all topics available.
// TODO: to add 'banners', 'diary'.
const MAIN_PAGE_ENTITIES = ['articles', 'tags'];

export const MAIN_PAGE_DATA_SCHEMA = Joi.object().pattern(
  Joi.string().valid(MAIN_PAGE_ENTITIES),
  Joi.array().items(Joi.objectId())
);
