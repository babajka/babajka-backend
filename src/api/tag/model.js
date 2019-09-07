import mongoose from 'mongoose';

import { TAG_CONTENT_SCHEMA } from 'constants/topic';
import Joi, { joiToMongoose, validate } from 'utils/joi';

const joiTagSchema = Joi.object({
  fiberyId: Joi.string().meta({ unique: true }),
  // WARNING: not unique (tags in fibery are different types)
  fiberyPublicId: Joi.string(),
  topic: Joi.objectId()
    .meta({ ref: 'Topic' })
    .required(),
  topicSlug: Joi.slug(),
  slug: Joi.slug(),
  // content depends on which `Topic` this `Tag` belongs to.
  // TODO: add `topicSlug` field and validate content against it
  // with Joi.when
  // https://github.com/hapijs/joi/blob/v15/API.md#anywhencondition-options
  content: Joi.object().required(),
  metadata: Joi.metadata().required(),
});

export const validateTag = data => {
  const schema = joiTagSchema.keys({ content: TAG_CONTENT_SCHEMA[data.topicSlug] });
  return validate(data, schema);
};

const TagSchema = joiToMongoose(joiTagSchema, {}, validateTag);

TagSchema.statics.customQuery = function({ query = {} } = {}) {
  return this.find(query)
    .select('-__v -metadata')
    .populate('topic', 'slug');
};

const Tag = mongoose.model('Tag', TagSchema);
export default Tag;
