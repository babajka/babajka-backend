import { Joi } from 'validation';

export const MAIN_PAGE_KEY = 'main-page-key';
export const SIDEBAR_KEY = 'sidebar-key';

// This is a list of Main Page Entities to be accepted by setMainPage() method.
// Note: 'topics' are not accepted; get method always returns all topics available.
// TODO: to add 'banners', 'diary'.
const MAIN_PAGE_ENTITIES = ['articles', 'tags'];
const SIDEBAR_ENTITIES = ['tags'];

const getDataSchema = entities =>
  Joi.object().pattern(Joi.string().valid(entities), Joi.array().items(Joi.objectId()));

export const joiMainPageDataSchema = getDataSchema(MAIN_PAGE_ENTITIES);
export const joiSidebarDataSchema = getDataSchema(SIDEBAR_ENTITIES);
