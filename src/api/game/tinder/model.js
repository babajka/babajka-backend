import mongoose from 'mongoose';

import Joi, { joiToMongoose } from 'utils/joi';

const joiTinderPersonSchema = Joi.object({
  fiberyId: Joi.string()
    .meta({ unique: true })
    .required(),
  fiberyPublicId: Joi.string()
    .meta({ unique: true })
    .required(),

  nickname: Joi.string().allow(null),
  personTag: Joi.objectId()
    .meta({ ref: 'Tag' })
    .allow(null),

  photoUrl: Joi.string().required(),

  description: Joi.object().required(),
  acceptMessage: Joi.object().required(),
});

export const POPULATE_PERSON_TAG = {
  path: 'people.personTag',
  select: '-_id -__v -metadata -fiberyId',
  populate: {
    path: 'topic',
    select: '-_id slug',
  },
};

export const formatTinderPerson = ({
  fiberyPublicId,
  nickname,
  personTag,
  photoUrl,
  description,
  acceptMessage,
}) => ({
  personStatsId: fiberyPublicId,
  nickname,
  personTag,
  photoUrl,
  description,
  acceptMessage,
});

const joiTinderGameSchema = Joi.object({
  fiberyId: Joi.string()
    .meta({ unique: true })
    .required(),
  fiberyPublicId: Joi.string()
    .meta({ unique: true })
    .required(),

  title: Joi.string().required(),
  subtitle: Joi.string().required(),

  slug: Joi.string()
    .meta({ unique: true })
    .required(),

  people: Joi.array().items(joiTinderPersonSchema),

  suggestedArticles: Joi.object().allow(null),
});

const TinderGameSchema = joiToMongoose(joiTinderGameSchema);

const TinderGame = mongoose.model('TinderGame', TinderGameSchema);

export const formatTinderGame = ({ title, subtitle, slug, people, suggestedArticles }) => ({
  title,
  subtitle,
  slug,
  people: people.map(formatTinderPerson),
  suggestedArticles,
});

export default TinderGame;
