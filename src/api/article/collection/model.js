import mongoose, { Schema } from 'mongoose';

import { slugValidator } from 'utils/validation';

const ArticleCollectionSchema = new Schema({
  // name and description (below) map locales (be, ru, ...) to strings.
  // Once amount of localized data increases implementation of LocalizedArticleCollection
  // model might be considered.
  name: {
    type: Schema.Types.Mixed,
    required: true,
  },
  description: Schema.Types.Mixed,
  // The order of articles below is essential and defines the structure of the collection.
  articles: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Article',
    },
  ],
  slug: {
    type: String,
    required: true,
    unique: true,
    validate: slugValidator,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

export const ArticleCollection = mongoose.model('ArticleCollection', ArticleCollectionSchema);

export default ArticleCollection;
