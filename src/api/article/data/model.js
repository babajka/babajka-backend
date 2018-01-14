import mongoose, { Schema } from 'mongoose';

const ArticleDataSchema = new Schema({
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
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ArticleData = mongoose.model('ArticleData', ArticleDataSchema);

export default ArticleData;
