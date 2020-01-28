import keyBy from 'lodash/keyBy';

export const getId = ({ _id }) => _id.toString();

export const mapIds = items => items.map(getId);

export const getTagsByTopic = ({ tags, topics }) => {
  const topicsById = keyBy(topics, '_id');
  return tags.reduce((acc, { topic: topicId, _id }) => {
    const topic = topicsById[topicId];
    if (!topic) {
      return acc;
    }
    const topicSlug = topic.slug;
    acc[topicSlug] = acc[topicSlug] || [];
    acc[topicSlug].push(_id);
    return acc;
  }, {});
};

export const getArticlesByTag = ({ articles, tags }) => {
  const tagsById = keyBy(tags, '_id');
  return articles.reduce((acc, article) => {
    article.tags.forEach(tag => {
      const tagData = tagsById[tag._id || tag];
      if (!tagData) {
        return;
      }
      const key = tagData.slug;
      acc[key] = acc[key] || [];
      acc[key].push(article._id);
    });
    return acc;
  }, {});
};
