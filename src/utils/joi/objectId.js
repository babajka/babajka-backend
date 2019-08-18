export default joi => ({
  name: 'objectId',
  base: joi
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .meta({ type: 'ObjectId' }),
});
