export default joi => ({
  name: 'userPermissions',
  base: joi
    .object()
    .default({})
    .meta({ type: Object }),
  // TODO: to apply permission validator.
});
