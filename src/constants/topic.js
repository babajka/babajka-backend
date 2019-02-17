import Joi from 'joi';

const LOCALIZED_TEXT_SCHEMA_BE_REQUIRED = Joi.object().keys({
  be: Joi.string().required(),
  en: Joi.string(),
  ru: Joi.string(),
});

// Tag Content Schemas must be consistent with the data in our Google Spreadsheet.
export const TAG_CONTENT_SCHEMA = {
  locations: Joi.object().keys({
    title: LOCALIZED_TEXT_SCHEMA_BE_REQUIRED.required(),
    image: Joi.string().required(),
  }),
  themes: Joi.object().keys({
    title: LOCALIZED_TEXT_SCHEMA_BE_REQUIRED.required(),
  }),
  personalities: Joi.object().keys({
    name: LOCALIZED_TEXT_SCHEMA_BE_REQUIRED.required(),
    dates: LOCALIZED_TEXT_SCHEMA_BE_REQUIRED.required(),
    image: Joi.string().required(),
    color: Joi.string()
      .regex(/^[0-9a-fA-F]{6}$/)
      .required(),
    description: LOCALIZED_TEXT_SCHEMA_BE_REQUIRED.required(),
  }),
  times: Joi.object().keys({
    title: LOCALIZED_TEXT_SCHEMA_BE_REQUIRED,
  }),
};

// This is a complete list of all topics we support.
// This must be synced with 'topic' tab of our i18n spreadsheet.
export const TOPIC_SLUGS = Object.keys(TAG_CONTENT_SCHEMA);
