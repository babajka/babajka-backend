/* eslint-disable no-console */

// The script updates databases with data from Fibery.io.
// The script is executed as follows:
//   npm run init-db-secret
//
// Examples:
// * to populate local db:
//   npm run init-db
// * to populate remote db:
//   npm run init-db -- --secretPath=/home/user/secret.json

import mongoose from 'mongoose';
import keyBy from 'lodash/keyBy';
import sampleSize from 'lodash/sampleSize';

import connectDb from 'db';
import { User } from 'api/user';
import { Article, ArticleCollection } from 'api/article';
import { StorageEntity } from 'api/storage/model';
import { Diary } from 'api/specials';
import { Tag } from 'api/tag';
import { Topic } from 'api/topic';
import { getInitObjectMetadata } from 'api/helpers/metadata';

import * as permissions from 'constants/permissions';
import { MAIN_PAGE_KEY, SIDEBAR_KEY } from 'constants/storage';

import { addTopics } from 'utils/testing';
import { getId, mapIds, getTagsByTopic, getArticlesByTag } from 'utils/getters';

import importArticles from './importArticles';
import importDiaries from './importDiaries';
import { retrieveMetadataTestingUser } from './utils';

const SIDEBAR_BLOCKS = ['themes', 'personalities', 'times', 'locations', 'brands', 'authors'];

const USERS = [
  {
    email: 'admin@babajka.io',
    firstName: 'Fox',
    lastName: 'Muller',
    password: 'password',
    permissionsPreset: 'admin',
  },
  {
    email: 'creator@babajka.io',
    firstName: 'Dana',
    lastName: 'Scally',
    password: 'password1',
    permissionsPreset: 'contentManager',
  },
  {
    email: 'user@babajka.io',
    firstName: 'Джон',
    lastName: 'Сміт',
    password: 'password2',
    bio: 'бла-бла-бла',
    imageUrl: '/test/images/einstein.jpeg',
  },
];

const initUsers = () =>
  Promise.all(
    USERS.map(async userData => {
      const permPreset = userData.permissionsPreset || 'user';

      const user = new User(userData);
      user.permissions = permissions[permPreset];

      await user.setPassword(userData.password);

      return user.save();
    })
  );

export const initMainPageState = async metadataTestingUser => {
  const articles = await Article.find();
  const topics = await Topic.find().exec();
  const tags = await Tag.find().exec();
  const tagsBySlug = keyBy(tags, 'slug');
  const articlesByTag = getArticlesByTag({ articles, tags });
  const tagsWithArticles = tags.filter(
    ({ slug }) => articlesByTag[slug] && articlesByTag[slug].length
  );
  const { personalities = [], locations = [] } = getTagsByTopic({ tags: tagsWithArticles, topics });

  const hasPersonalities = personalities.length > 2;
  if (!hasPersonalities) {
    console.log(`Not enough personalities tags ${personalities.length}/3!`);
  }

  const hasLocations = locations.length > 2;
  if (!hasLocations) {
    console.log(`Not enough locations tags ${locations.length}/3!`);
  }

  const [cinema] = articlesByTag.cinema;
  const [a1, a2] = sampleSize(articles, 2).map(getId);

  const state = {
    blocks: [
      { type: 'featured', articleId: getId(cinema), frozen: true },
      { type: 'diary' },
      {
        type: 'latestArticles',
        articlesIds: [{ id: a1, frozen: true }, { id: a2, frozen: true }],
      },
      hasPersonalities && {
        type: 'tagsByTopic',
        topicSlug: 'personalities',
        tagsIds: sampleSize(personalities, 3),
        style: '1-2',
      },
      {
        type: 'articlesByTag3',
        tagId: getId(tagsBySlug.linguistics),
        articlesIds: sampleSize(articlesByTag.linguistics, 3),
      },
      {
        type: 'articlesByTag2',
        tagId: getId(tagsBySlug.modernism),
        articlesIds: sampleSize(articlesByTag.modernism, 2),
      },
      {
        type: 'banner',
        banner: 'mapa',
      },
      hasLocations && {
        type: 'tagsByTopic',
        topicSlug: 'locations',
        tagsIds: sampleSize(locations, 3),
        style: '2-1',
      },
      {
        type: 'articlesByTag2',
        tagId: getId(tagsBySlug.minsk),
        articlesIds: sampleSize(articlesByTag.minsk, 2),
      },
      {
        type: 'articlesByTag2',
        tagId: getId(tagsBySlug.libra),
        articlesIds: sampleSize(articlesByTag.libra, 2),
      },
    ].filter(Boolean),
    data: {
      articles: mapIds(articles),
      tags: mapIds(tagsWithArticles),
    },
  };

  return StorageEntity.setValue(MAIN_PAGE_KEY, state, getId(metadataTestingUser));
};

const initSidebarState = async metadataTestingUser => {
  const rawTags = await Tag.find();

  const articles = await Article.find();
  const articlesByTag = getArticlesByTag({ articles, tags: rawTags });
  const tags = rawTags.filter(({ slug }) => articlesByTag[slug] && articlesByTag[slug].length);

  const topics = await Topic.find().exec();
  const tagsByTopic = getTagsByTopic({ tags, topics });

  const blocks = SIDEBAR_BLOCKS.map(topic => ({
    topic,
    tags: tagsByTopic[topic],
  }));

  const state = { blocks, data: { tags: mapIds(tags) } };
  return StorageEntity.setValue(SIDEBAR_KEY, state, getId(metadataTestingUser));
};

const run = async () => {
  try {
    await connectDb();
    await mongoose.connection.db.dropDatabase();
    console.log('Mongoose: drop database');

    await initUsers();
    console.log(`Mongoose: insert ${await User.countDocuments()} users`);

    const metadataTestingUser = await retrieveMetadataTestingUser();
    const commonMetadata = getInitObjectMetadata(metadataTestingUser);
    const topics = await addTopics(commonMetadata);
    console.log(`Mongoose: insert ${topics.length} topics`);

    await importArticles(metadataTestingUser);
    const articlesCount = await Article.countDocuments();
    console.log(`Mongoose: insert ${articlesCount} articles`);
    console.log(`Mongoose: insert ${await ArticleCollection.countDocuments()} article collections`);

    await importDiaries(metadataTestingUser);
    console.log(`Mongoose: insert ${await Diary.countDocuments()} diaries`);
    console.log(`Mongoose: insert ${await Tag.countDocuments()} tags`);

    if (articlesCount) {
      await initMainPageState(metadataTestingUser);
      console.log('Mongoose: main page state pushed');

      await initSidebarState(metadataTestingUser);
      console.log('Mongoose: sidebar state pushed');
    }

    // PLACEHOLDER.
  } catch (err) {
    console.log('Mongoose: error during database init');
    console.error(err);
    process.exit();
  }
  process.exit();
};

if (require.main === module) {
  run();
}
