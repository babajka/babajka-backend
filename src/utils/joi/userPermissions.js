export default joi => ({
  name: 'userPermissions',
  base: joi.object().default({}),
  // TODO: to apply permission validator.
});
