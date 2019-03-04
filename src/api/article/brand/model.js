import mongoose from 'mongoose';

import { slugValidator } from 'utils/validation';

const { Schema } = mongoose;

const ArticleBrandSchema = new Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    validate: slugValidator,
  },
  // names maps locales (be, ru, ...) to the name. Once amount of localized data for
  // ArticleBrand increases implementation of LocalizedArticleBrand model might be considered.
  names: Schema.Types.Mixed,
  // imageUrl is a default, full-size brand logo/image.
  imageUrl: String,
  // imageUrlSmall is a small, resized image for i.e. article tiles preview.
  imageUrlSmall: String,
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

ArticleBrandSchema.statics.customQuery = function({ query = {} } = {}) {
  return this.find(query).select('-__v');
};

const ArticleBrand = mongoose.model('ArticleBrand', ArticleBrandSchema);

export default ArticleBrand;
