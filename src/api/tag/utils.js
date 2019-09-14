import keyBy from 'lodash/keyBy';

import Tag, { validateTag } from 'api/tag/model';
import Topic from 'api/topic/model';
import { validateList } from 'utils/validation';
import { mapIds, getId } from 'utils/getters';

const attach = (tags, { topics, metadata }) =>
  tags.map(t => ({
    ...t,
    topic: getId(topics[t.topic.slug]),
    topicSlug: t.topic.slug,
    metadata,
  }));

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

export const updateTags = async (
  data,
  metadata,
  { skipValidation = false, skipMap = false } = {}
) => {
  const topics = keyBy(await Topic.find({}).select('slug'), 'slug');
  const tags = attach(data, { topics, metadata });
  if (!skipValidation) {
    await validateList(tags, validateTag, 'tags');
  }
  await update(tags);
  const fiberyIds = tags.map(({ fiberyId }) => fiberyId);
  const dbTags = await Tag.find({ fiberyId: { $in: fiberyIds } });
  return skipMap ? dbTags : mapIds(dbTags);
};
