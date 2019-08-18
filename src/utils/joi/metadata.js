export const getSchema = joi =>
  joi.object({
    createdAt: joi.date().required(),
    updatedAt: joi.date().required(),
    createdBy: joi.userRef().required(),
    updatedBy: joi.userRef().required(),
  });

export default joi => ({
  name: 'metadata',
  base: getSchema(joi).meta({ type: Object }),
});
