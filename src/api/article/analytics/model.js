import mongoose from 'mongoose';

import Joi, { joiToMongoose } from 'utils/joi';

import { LOCALES } from 'constants/misc';

export const joiContentAnalyticsSchema = Joi.object({
  slug: Joi.string()
    .meta({ unique: true })
    .required(),
  metrics: Joi.object(
    LOCALES.reduce((acc, loc) => {
      acc[loc] = Joi.number();
      return acc;
    }, {})
  ),
});

const ContentAnalyticsSchema = joiToMongoose(joiContentAnalyticsSchema);

const ContentAnalytics = mongoose.model('contentAnalytics', ContentAnalyticsSchema);

export default ContentAnalytics;
