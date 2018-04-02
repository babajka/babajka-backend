import mongoose, { Schema } from 'mongoose';

import { slugValidator } from 'utils/validation';

const LocalizedArticleSchema = new Schema({
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
  text: Schema.Types.Mixed,
  slug: {
    type: String,
    required: true,
    unique: true,
    validate: slugValidator,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

const LocalizedArticle = mongoose.model('LocalizedArticle', LocalizedArticleSchema);

export default LocalizedArticle;
