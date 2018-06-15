import mongoose, { Schema } from 'mongoose';

import { slugValidator } from 'utils/validation';

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
    createdAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    usePushEach: true,
  }
);

const LocalizedArticle = mongoose.model('LocalizedArticle', LocalizedArticleSchema);

export default LocalizedArticle;
