import { Joi, joiSchemas } from 'validation';

export const TAG_CONTENT_SCHEMA = {
  locations: Joi.object({
    title: joiSchemas.localizedText.required(),
    image: Joi.string().required(),
  }),
  themes: Joi.object({
    title: joiSchemas.localizedText.required(),
  }),
  personalities: Joi.object({
    name: joiSchemas.localizedText.required(),
    dates: joiSchemas.localizedText.required(),
    image: Joi.string().required(),
    color: Joi.string()
      .regex(/^[0-9a-fA-F]{6}$/)
      .required(),
    description: joiSchemas.localizedText.required(),
  }),
  times: Joi.object({
    title: joiSchemas.localizedText,
  }),
  brands: Joi.object({
    title: joiSchemas.localizedText.required(),
    // TODO: to improve images validation.
    image: Joi.string().required(),
  }),
  authors: Joi.object({
    firstName: joiSchemas.localizedText.required(),
    lastName: joiSchemas.localizedText.required(),
    bio: joiSchemas.localizedText.required(),
    // TODO: to improve images validation.
    image: Joi.string().required(),
  }),
};

// This is a complete list of all topics we support.
// This must be synced with 'topic' tab of our i18n spreadsheet.
export const TOPIC_SLUGS = Object.keys(TAG_CONTENT_SCHEMA);
