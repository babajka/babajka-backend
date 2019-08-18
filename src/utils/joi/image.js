export default joi => ({
  name: 'image',
  base: joi
    .string()
    .uri()
    .required()
    .meta({ type: String }),
});
