import Joi from 'utils/joi';

export const TAG_CONTENT_SCHEMA = {
  locations: Joi.object({
    title: Joi.localizedText().required(),
    image: Joi.string().required(),
  }),
  themes: Joi.object({
    title: Joi.localizedText().required(),
  }),
  personalities: Joi.object({
    name: Joi.localizedText().required(),
    dates: Joi.localizedText().required(),
    image: Joi.string().required(),
    color: Joi.string()
      .regex(/^[0-9a-fA-F]{6}$/)
      .required(),
    description: Joi.localizedText().required(),
  }),
  times: Joi.object({
    title: Joi.localizedText(),
  }),
  brands: Joi.object({
    title: Joi.localizedText().required(),
    // TODO: to improve images validation.
    image: Joi.string().required(),
  }),
  authors: Joi.object({
    firstName: Joi.localizedText().required(),
    lastName: Joi.localizedText().required(),
    bio: Joi.localizedText().required(),
    // TODO: to improve images validation.
    image: Joi.string().required(),
  }),
};

// This is a complete list of all topics we support.
// This must be synced with 'topic' tab of our i18n spreadsheet.
export const TOPIC_SLUGS = Object.keys(TAG_CONTENT_SCHEMA);
