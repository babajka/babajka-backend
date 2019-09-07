import keyBy from 'lodash/keyBy';

import Tag, { validateTag } from 'api/tag/model';
import Topic from 'api/topic/model';
import { ValidationError } from 'utils/validation';
import { mapIds, getId } from 'utils/getters';

const attach = (tags, { topics, metadata }) =>
  tags.map(t => ({
    ...t,
    topic: getId(topics[t.topic.slug]),
    topicSlug: t.topic.slug,
    metadata,
  }));

const validate = tags => {
  const errors = tags.map(validateTag).reduce((acc, error, index) => {
    if (!error) {
      return acc;
    }
    // data for render error on frontend
    return acc.concat({ data: tags[index], error });
  }, []);
  if (errors.length) {
    throw new ValidationError({ tags: errors });
  }
};

const update = tags =>
  Promise.all(
    tags.map(tag =>
      // Q: why not `findOneAndUpdate`?
      Tag.updateOne({ fiberyId: tag.fiberyId }, tag, {
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }).exec()
    )
  );

export const updateTags = async (data, metadata) => {
  const topics = keyBy(await Topic.find({}).select('slug'), 'slug');
  const tags = attach(data, { topics, metadata });
  await validate(tags);
  await update(tags);
  const fiberyIds = tags.map(({ fiberyId }) => fiberyId);
  const dbTags = await Tag.find({ fiberyId: { $in: fiberyIds } });
  return mapIds(dbTags);
};
