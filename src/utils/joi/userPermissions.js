export default joi => ({
  name: 'userPermissions',
  base: joi
    .object()
    .pattern(joi.string(), joi.boolean())
    .default({})
    .meta({ type: Object }),
});
