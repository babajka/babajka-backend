import mongoose from 'mongoose';

export default joi => ({
  name: 'objectId',
  base: joi
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .meta({ type: 'ObjectId' }),
  // eslint-disable-next-line no-unused-vars
  coerce(value, state, options) {
    if (value instanceof mongoose.Types.ObjectId) {
      return value.toString();
    }
    return value;
  },
});
