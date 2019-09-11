export default joi => ({
  name: 'image',
  base: joi
    .string()
    .uri({ allowRelative: true })
    .regex(/^(\/api\/files|https?)/)
    .required()
    .meta({ type: String }),
});
