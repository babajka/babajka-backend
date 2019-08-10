import mongoose from 'mongoose';

import { joiMetadataSchema } from 'api/helpers/metadata';
import { Joi, joiToMongoose } from 'validation';
import { TOPIC_SLUGS } from 'constants/topic';

const joiTopicSchema = Joi.object({
  slug: Joi.string()
    .valid(TOPIC_SLUGS)
    .required()
    .meta({ unique: true }),
  metadata: joiMetadataSchema.required(),
});

const TopicSchema = joiToMongoose(joiTopicSchema);

TopicSchema.statics.getAll = function() {
  return this.find().select('slug');
};

const Topic = mongoose.model('Topic', TopicSchema);

export default Topic;
