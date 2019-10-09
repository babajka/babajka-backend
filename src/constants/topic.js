import Joi from 'utils/joi';

export const TAG_CONTENT_SCHEMA = {
  locations: Joi.object({
    title: Joi.localizedText().required(),

    image: Joi.image(),
    color: Joi.color(),
    theme: Joi.theme(),
  }),
  themes: Joi.object({
    title: Joi.localizedText().required(),
  }),
  personalities: Joi.object({
    name: Joi.localizedText().required(),
    subtitle: Joi.localizedText().required(),
    description: Joi.localizedText().required(),

    diaryImage: Joi.image(),
    image: Joi.image(),
    color: Joi.color(),
    theme: Joi.theme(),
  }),
  times: Joi.object({
    title: Joi.localizedText().required(),
  }),
  brands: Joi.object({
    title: Joi.localizedText().required(),
    // TODO: to remove after fron sync
    image: Joi.image(),
    images: Joi.object({
      black: Joi.image(),
      white: Joi.image(),
    }).required(),
  }),
  authors: Joi.object({
    firstName: Joi.localizedText().required(),
    lastName: Joi.localizedText().required(),
    // bio: Joi.localizedText().required(),
    bio: Joi.object(),
    image: Joi.image(),
  }),
};

// This is a complete list of all topics we support.
export const TOPIC_SLUGS = Object.keys(TAG_CONTENT_SCHEMA);
