export default joi => ({
  name: 'slug',
  base: joi
    .string()
    .regex(/^[a-zA-Z0-9_-]+$/)
    .meta({ type: String }),
});
