export default joi => ({
  name: 'color',
  base: joi
    .string()
    .regex(/^[0-9a-fA-F]{6}$/)
    .meta({ type: String }),
});
