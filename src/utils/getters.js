import keyBy from 'lodash/keyBy';

export const getId = ({ _id }) => _id.toString();

export const safeGetId = o => o._id || o;

export const mapIds = items => items.map(getId);

export const getTagsByTopic = ({ tags, topics }) => {
  const topicsById = keyBy(topics, '_id');
  return tags.reduce((acc, { topic, _id }) => {
    const topicSlug = topicsById[topic].slug;
    acc[topicSlug] = acc[topicSlug] || [];
    acc[topicSlug].push(_id);
    return acc;
  }, {});
};

// when articles didn't populated with tags - use `tagsById` to provide `slugs`
export const getArticlesByTag = ({ articles, tagsById }) =>
  articles.reduce((acc, article) => {
    article.tags.forEach(tag => {
      const tagSlug = tagsById ? tagsById[tag].slug : tag.slug;
      acc[tagSlug] = acc[tagSlug] || [];
      acc[tagSlug].push(article._id);
    });
    return acc;
  }, {});
