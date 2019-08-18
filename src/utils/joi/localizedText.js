export default joi => ({
  name: 'localizedText',
  base: joi
    .object({
      be: joi.string().required(),
      en: joi.string(),
      ru: joi.string(),
    })
    .meta({ type: Object }),
});
