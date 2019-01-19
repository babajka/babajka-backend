import mongoose from 'mongoose';

import { ObjectMetadata } from 'api/helpers/metadata';
import { TOPIC_SLUGS } from 'constants/topic';

const { Schema } = mongoose;

const TopicSchema = new Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    enum: TOPIC_SLUGS,
  },
  metadata: {
    type: ObjectMetadata.schema,
    required: true,
  },
});

// eslint-disable-next-line func-names
TopicSchema.statics.getAll = function() {
  return this.find().select('-_id slug');
};

const Topic = mongoose.model('Topic', TopicSchema);

export default Topic;
