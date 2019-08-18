import mongoose from 'mongoose';
import set from 'lodash/set';

import { joiMetadataSchema } from 'api/helpers/metadata';
import { Topic } from 'api/topic';
import { TAG_CONTENT_SCHEMA } from 'constants/topic';
import { ValidationError } from 'utils/validation';
import Joi, { joiToMongoose } from 'utils/joi';

const joiTagSchema = Joi.object({
  topic: Joi.string()
    .meta({ type: 'ObjectId', ref: 'Topic' })
    .required(),
  slug: Joi.string()
    .required()
    .meta({ unique: true }),
  // content depends on which `Topic` this `Tag` belongs to.
  content: Joi.object().required(),
  metadata: joiMetadataSchema.required(),
});

const TagSchema = joiToMongoose(joiTagSchema);

TagSchema.pre('validate', async function(next) {
  const topic = await Topic.findOne({ _id: this.topic });

  const { error } = Joi.validate(this.content, TAG_CONTENT_SCHEMA[topic.slug]);
  if (error !== null) {
    const errors = {};
    error.details.forEach(({ path, type }) => {
      set(errors, path, type);
    });

    next(new ValidationError(errors));
  }

  next();
});

TagSchema.statics.customQuery = function({ query = {} } = {}) {
  return this.find(query)
    .select('-__v -metadata')
    .populate('topic', 'slug');
};

const Tag = mongoose.model('Tag', TagSchema);

export default Tag;
