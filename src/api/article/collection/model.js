import mongoose, { Schema } from 'mongoose';

const ArticleCollectionSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  // The order of articles below is essential and defines the structure of the collection.
  articles: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Article',
    },
  ],
  description: String,
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

export const ArticleCollection = mongoose.model('ArticleCollection', ArticleCollectionSchema);

export default ArticleCollection;
