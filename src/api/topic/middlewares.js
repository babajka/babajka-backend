import { TOPIC_SLUGS } from 'constants/topic';

import { ValidationError } from 'utils/validation';

export const verifyTopicName = ({ params: { topic } }, res, next) => {
  if (!TOPIC_SLUGS.includes(topic)) {
    return next(new ValidationError({ topic: 'not supported' }));
  }

  return next();
};
