export default joi => ({
  name: 'locale',
  base: joi
    .string()
    .regex(/^[a-z]{2}$/)
    .meta({ type: String }),
});
