import mongoose from 'mongoose';

import { slugValidator } from 'utils/validation';

import { ObjectMetadata } from 'api/helpers/metadata';

const { Schema } = mongoose;

const LocalizedArticleSchema = new Schema(
  {
    articleId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    locale: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      required: true,
    },
    video: String,
    image: String,
    content: Schema.Types.Mixed,
    slug: {
      type: String,
      required: true,
      unique: true,
      validate: slugValidator,
    },
    metadata: {
      type: ObjectMetadata.schema,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    usePushEach: true,
    minimize: false,
  }
);

const LocalizedArticle = mongoose.model('LocalizedArticle', LocalizedArticleSchema);

export default LocalizedArticle;
