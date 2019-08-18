export default joi => ({
  name: 'userRef',
  base: joi.string().meta({ type: 'ObjectId', ref: 'User' }),
});
