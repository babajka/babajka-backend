export default joi => ({
  name: 'slug',
  base: joi
    .string()
    .required()
    .regex(/^[a-zA-Z0-9_-]+$/)
    .meta({ type: String, unique: true }),
});
