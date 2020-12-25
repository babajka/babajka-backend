import Joi, { joiToMongoose } from 'utils/joi';
import mongoose from 'mongoose';

const joiCounterSchema = Joi.object({
  key: Joi.string()
    .required()
    .meta({ unique: true }),
  count: Joi.number().default(0),
});

const CounterSchema = joiToMongoose(joiCounterSchema);

CounterSchema.statics.ensureExists = function(key) {
  return this.findOneAndUpdate(
    { key },
    {
      $setOnInsert: {
        count: 0,
      },
    },
    { upsert: true }
  );
};

CounterSchema.statics.inc = function(key) {
  // This is an atomic inc which will work fine on concurrent queries to db.
  return this.update({ key }, { $inc: { count: 1 } });
};

const Counter = mongoose.model('Counter', CounterSchema);

export default Counter;
