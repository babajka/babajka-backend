import mongoose from 'mongoose';

import Joi, { joiToMongoose } from 'utils/joi';

export const joiContentAnalyticsSchema = Joi.object({
  slug: Joi.string(),
  metrics: Joi.object(),
});

const ContentAnalyticsSchema = joiToMongoose(joiContentAnalyticsSchema);

const ContentAnalytics = mongoose.model('contentAnalytics', ContentAnalyticsSchema);

export default ContentAnalytics;
