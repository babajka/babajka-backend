export default joi => ({
  name: 'userRef',
  base: joi.object().meta({ type: 'ObjectId', ref: 'User' }),
});
