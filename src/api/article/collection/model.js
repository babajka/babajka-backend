import mongoose, { Schema } from 'mongoose';
import omit from 'lodash/omit';

import { slugValidator } from 'utils/validation';

import { serializeArticle } from 'api/article/article.model';

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
  imageUrl: String,
});

export const ArticleCollection = mongoose.model('ArticleCollection', ArticleCollectionSchema);

export const serializeCollection = collection => ({
  ...omit(collection.toObject(), ['__v']),
  articles: collection.articles.map(article => serializeArticle(article, false)),
});

export const COLLECTION_POPULATE_OPTIONS = {
  articles: publishedOnly => ({
    path: 'articles',
    match: publishedOnly ? { publishAt: { $lt: Date.now() } } : undefined,
    populate: {
      path: 'locales',
    },
  }),
};

export default ArticleCollection;
