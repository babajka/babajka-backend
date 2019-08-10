import { Joi } from './index';

const schemas = {};

schemas.userRef = Joi.string().meta({ type: 'ObjectId', ref: 'User' });

schemas.localizedText = Joi.object({
  be: Joi.string().required(),
  en: Joi.string(),
  ru: Joi.string(),
});

schemas.color = Joi.string().regex(/^[0-9a-fA-F]{6}$/);

export default schemas;
