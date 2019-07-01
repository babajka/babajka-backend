import Joi from 'joi';
import joiObjectId from 'joi-objectid';

Joi.objectId = joiObjectId(Joi);

const DATA_SCHEMA = entities =>
  Joi.object().pattern(Joi.string().valid(entities), Joi.array().items(Joi.objectId()));

export const MAIN_PAGE_KEY = 'main-page-key';

// This is a list of Main Page Entities to be accepted by setMainPage() method.
// Note: 'topics' are not accepted; get method always returns all topics available.
// TODO: to add 'banners', 'diary'.
const MAIN_PAGE_ENTITIES = ['articles', 'tags'];

export const MAIN_PAGE_DATA_SCHEMA = DATA_SCHEMA(MAIN_PAGE_ENTITIES);

export const SIDEBAR_KEY = 'sidebar-key';

const SIDEBAR_ENTITIES = ['tags'];

export const SIDEBAR_DATA_SCHEMA = DATA_SCHEMA(SIDEBAR_ENTITIES);
