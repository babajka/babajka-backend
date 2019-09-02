import Joi from 'utils/joi';

export const TAG_CONTENT_SCHEMA = {
  locations: Joi.object({
    title: Joi.localizedText().required(),
    // TODO: to improve images validation. (Joi.image)
    image: Joi.string().required(),
  }),
  themes: Joi.object({
    title: Joi.localizedText().required(),
  }),
  personalities: Joi.object({
    name: Joi.localizedText().required(),
    subtitle: Joi.localizedText().required(),
    image: Joi.string().required(),
    color: Joi.color().required(),
    description: Joi.localizedText().required(),
  }),
  times: Joi.object({
    title: Joi.localizedText(),
  }),
  brands: Joi.object({
    title: Joi.localizedText().required(),
    // TODO: to improve images validation. (Joi.image)
    image: Joi.string().required(),
  }),
  authors: Joi.object({
    firstName: Joi.localizedText().required(),
    lastName: Joi.localizedText().required(),
    bio: Joi.localizedText().required(),
    // TODO: to improve images validation. (Joi.image)
    image: Joi.string().required(),
  }),
};

// This is a complete list of all topics we support.
export const TOPIC_SLUGS = Object.keys(TAG_CONTENT_SCHEMA);
