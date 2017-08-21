import mongoose, { Schema } from 'mongoose';

const ArticleTypeSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

export const ArticleType = mongoose.model('ArticleType', ArticleTypeSchema);

export default ArticleType;
