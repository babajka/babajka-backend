import mongoose from 'mongoose';

import Joi, { joiToMongoose } from 'utils/joi';

const joiXYGameOutcomeSchema = Joi.object({
  fiberyId: Joi.string()
    .meta({ unique: true })
    .required(),
  fiberyPublicId: Joi.string()
    .meta({ unique: true })
    .required(),

  input: Joi.string().required(),
  text: Joi.object({
    be: Joi.object().required(),
  }).required(),
});

export const formatXYGameOutcome = ({ input, text }) => ({ input, text });

const joiXYGameSchema = Joi.object({
  fiberyId: Joi.string()
    .meta({ unique: true })
    .required(),
  fiberyPublicId: Joi.string()
    .meta({ unique: true })
    .required(),

  title: Joi.object({
    be: Joi.string().required(),
  }).required(),
  subtitle: Joi.object({
    be: Joi.string().required(),
  }).required(),
  slug: Joi.object({
    be: Joi.string().required(),
  }).required(),
  inputType: Joi.string()
    .valid(['AGE'])
    .required(),
  question: Joi.object({
    be: Joi.string().required(),
  }).required(),
  response: Joi.object({
    be: Joi.string().required(),
  }).required(),

  images: Joi.object().required(),
  color: Joi.color(),

  outcomes: Joi.array().items(joiXYGameOutcomeSchema),

  suggestedArticles: Joi.object().allow(null),
});

const XYGameSchema = joiToMongoose(joiXYGameSchema);

const XYGame = mongoose.model('XYGame', XYGameSchema);

export const formatXYGame = ({
  title,
  subtitle,
  slug,
  inputType,
  question,
  response,
  images,
  color,
  suggestedArticles,
}) => ({
  title,
  subtitle,
  slug,
  inputType,
  question,
  response,
  images,
  color,
  suggestedArticles,
});

export default XYGame;
