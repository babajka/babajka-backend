export default joi => ({
  name: 'localizedText',
  base: joi
    .object({
      be: joi.string().required(),
      en: joi.string().allow(null),
      ru: joi.string().allow(null),
    })
    .meta({ type: Object }),
});
