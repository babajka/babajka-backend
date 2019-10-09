export default joi => ({
  name: 'image',
  base: joi
    .string()
    .allow(null)
    .uri({ allowRelative: true })
    .regex(/^(\/api\/files|https?)/)
    .meta({ type: String }),
});
