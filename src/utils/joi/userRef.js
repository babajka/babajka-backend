export default joi => ({
  name: 'userRef',
  base: joi.objectId().meta({ ref: 'User' }),
});
