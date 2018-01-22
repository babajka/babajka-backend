import mongoose, { Schema } from 'mongoose';

import { slugValidator } from 'utils/validation';

const ArticleBrandSchema = new Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    validate: slugValidator,
  },
  image: String,
  // names maps locales (be, ru, ...) to the name. Once amount of localized data for
  // ArticleBrand increases implementation of LocalizedArticleBrand model might be considered.
  names: Schema.Types.Mixed,
});

export const ArticleBrand = mongoose.model('ArticleBrand', ArticleBrandSchema);

export default ArticleBrand;
