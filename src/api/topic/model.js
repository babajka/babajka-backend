import mongoose from 'mongoose';

import Joi, { joiToMongoose } from 'utils/joi';
import { TOPIC_SLUGS } from 'constants/topic';

const joiTopicSchema = Joi.object({
  slug: Joi.slug().valid(TOPIC_SLUGS),
  metadata: Joi.metadata().required(),
});

const TopicSchema = joiToMongoose(joiTopicSchema);

TopicSchema.statics.getAll = function() {
  return this.find().select('slug');
};

const Topic = mongoose.model('Topic', TopicSchema);

export default Topic;
