import mongoose from 'mongoose';

import { TAG_CONTENT_SCHEMA, TOPIC_SLUGS } from 'constants/topic';
import Joi, { joiToMongoose, defaultValidator } from 'utils/joi';

const joiTagSchema = Joi.object({
  fiberyId: Joi.string()
    .meta({ unique: true })
    .required(),
  // WARNING: not unique (tags in fibery are different types)
  fiberyPublicId: Joi.string(),
  // Q: do we need Topic as a model?
  topic: Joi.objectId()
    .meta({ ref: 'Topic' })
    .required(),
  topicSlug: Joi.string().valid(TOPIC_SLUGS),
  slug: Joi.slug(),
  content: Joi.object().required(),
  metadata: Joi.metadata().required(),
});

export const validateTag = data => {
  const { topicSlug } = data;
  if (!topicSlug) {
    return { topicSlug: { type: 'required' } };
  }
  const schema = joiTagSchema.keys({
    content: TAG_CONTENT_SCHEMA[topicSlug].required(),
  });
  return defaultValidator(data, schema);
};

const TagSchema = joiToMongoose(joiTagSchema, {}, validateTag);

TagSchema.statics.customQuery = function({ query = {} } = {}) {
  return (
    this.find(query)
      .select('-__v -metadata')
      // can be ommited
      .populate('topic', 'slug')
  );
};

const Tag = mongoose.model('Tag', TagSchema);
export default Tag;
