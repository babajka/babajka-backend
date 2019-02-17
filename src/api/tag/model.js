import mongoose from 'mongoose';
import set from 'lodash/set';

import Joi from 'joi';

import { ObjectMetadata } from 'api/helpers/metadata';
import { Topic } from 'api/topic';
import { TAG_CONTENT_SCHEMA } from 'constants/topic';
import { ValidationError } from 'utils/validation';

const { Schema } = mongoose;

const TagSchema = new Schema({
  topic: {
    type: Schema.Types.ObjectId,
    ref: 'Topic',
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  content: {
    // Content depends on which Topic this Tag belongs to.
    type: Schema.Types.Mixed,
    required: true,
  },
  metadata: {
    type: ObjectMetadata.schema,
    required: true,
  },
});

// eslint-disable-next-line func-names
TagSchema.pre('validate', async function(next) {
  const topic = await Topic.findOne({ _id: this.topic });

  const { error } = Joi.validate(this.content, TAG_CONTENT_SCHEMA[topic.slug]);
  if (error !== null) {
    const errors = {};
    error.details.forEach(({ path, type }) => {
      set(errors, path, type);
    });

    next(new ValidationError({ errors }));
  }

  next();
});

// eslint-disable-next-line func-names
TagSchema.statics.customQuery = function({ query = {} } = {}) {
  return this.find(query)
    .select('-__v -metadata')
    .populate('topic', 'slug');
};

const Tag = mongoose.model('Tag', TagSchema);

export default Tag;
