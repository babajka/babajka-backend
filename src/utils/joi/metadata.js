export default joi => ({
  name: 'metadata',
  base: joi
    .object({
      createdAt: joi.date().required(),
      updatedAt: joi.date().required(),
      createdBy: joi.userRef().required(),
      updatedBy: joi.userRef().required(),
    })
    .meta({ type: Object }),
});
