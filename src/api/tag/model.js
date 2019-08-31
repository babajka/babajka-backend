import mongoose from 'mongoose';
import set from 'lodash/set';

import { Topic } from 'api/topic';
import { TAG_CONTENT_SCHEMA } from 'constants/topic';
import { ValidationError } from 'utils/validation';
import Joi, { joiToMongoose } from 'utils/joi';

const joiTagSchema = Joi.object({
  topic: Joi.objectId()
    .meta({ ref: 'Topic' })
    .required(),
  slug: Joi.slug(),
  // content depends on which `Topic` this `Tag` belongs to.
  // TODO: add `topicSlug` field and validate content against it
  // with Joi.when
  // https://github.com/hapijs/joi/blob/v15/API.md#anywhencondition-options
  content: Joi.object().required(),
  metadata: Joi.metadata().required(),
});

const TagSchema = joiToMongoose(joiTagSchema);

// TODO: remove
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
