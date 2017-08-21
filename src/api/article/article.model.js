import mongoose, { Schema } from 'mongoose';
import omit from 'lodash/omit';

const ArticleSchema = new Schema({
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
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  tags: [String],
  collectionId: {
    type: Schema.Types.ObjectId,
    // TODO: add reference to ArticleCollection
  },
  type: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'ArticleType',
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Article = mongoose.model('Article', ArticleSchema);

export const serializeArticle = article => (
  { ...omit(article.toObject(), ['_id', '__v']), type: article.type.name }
);

export default Article;
