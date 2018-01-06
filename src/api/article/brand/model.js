import mongoose, { Schema } from 'mongoose';

const ArticleBrandSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

export const ArticleBrand = mongoose.model('ArticleBrand', ArticleBrandSchema);

export default ArticleBrand;
