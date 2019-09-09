/* eslint-disable no-console */

// The script updates databases with data provided as a set of json files.
// The script is executed as follows:
//   npm run init-db -- path-to-secret-file path-to-data
//
// Examples:
// * to populate local db with data from this repo:
//   npm run init-db
// * to populate remote db with data from this repo:
//   npm run init-db -- '/home/user/secret.json'
// * to populate local db with golden data from Google Drive:
//   npm run init-db -- '' '${GOOGLE_DRIVE}/Wir/golden-data/'
// * to populate remote db with golden data from Google Drive:
//   npm run init-db -- '/home/user/secret.json' '${GOOGLE_DRIVE}/Wir/golden-data/'

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import keyBy from 'lodash/keyBy';
import sample from 'lodash/sample';
import sampleSize from 'lodash/sampleSize';
import noop from 'lodash/noop';

import connectDb from 'db';
import { User } from 'api/user';
import { Article, ArticleCollection } from 'api/article';
import { StorageEntity } from 'api/storage/model';
import { Diary } from 'api/specials';
import { Tag } from 'api/tag';
import { Topic } from 'api/topic';
import { getInitObjectMetadata } from 'api/helpers/metadata';
import { fiberyImport } from 'api/article/controller';

import * as permissions from 'constants/permissions';
import { MAIN_PAGE_KEY, SIDEBAR_KEY } from 'constants/storage';

import { addTopics } from 'utils/testing';
import { getId, mapIds, getTagsByTopic, getArticlesByTag } from 'utils/getters';

const SIDEBAR_BLOCKS = ['themes', 'personalities', 'times', 'locations', 'brands', 'authors'];

const defaultDataPath = `${__dirname}/../data/`;
const dataFilenames = {
  users: 'users.json',
  diaries: 'diary.json',
};

const initData = {};

const getData = () => {
  const customDir = process.argv[3] || '';
  if (customDir.length === 0) {
    console.log('No custom directory with init data provided: using default data to init db.');
  }

  Object.entries(dataFilenames).forEach(([dataType, filename]) => {
    let data;

    if (customDir.length > 0) {
      const customPath = path.join(customDir, filename);
      try {
        data = JSON.parse(fs.readFileSync(customPath, 'utf8'));
      } catch {
        console.log(
          `Custom path was provided but we failed to read data from:\n  ${customPath}\nUsing default file instead.`
        );
      }
    }

    if (!data) {
      const defaultPath = path.join(defaultDataPath, filename);
      data = JSON.parse(fs.readFileSync(defaultPath, 'utf8'));
    }

    initData[dataType] = data;
  });
};

const initUsers = () =>
  Promise.all(
    initData.users.map(async userData => {
      const permPreset = userData.permissionsPreset || 'user';

      const user = new User(userData);
      user.permissions = permissions[permPreset];

      await user.setPassword(userData.password);

      return user.save();
    })
  );

export const retrieveMetadataTestingUser = async () => User.findOne({ email: 'admin@babajka.io' });

const INIT_ARTICLES = [
  'https://wir.fibery.io/Content~Marketing/139#Article/38',
  'https://wir.fibery.io/Content~Marketing/139#Article/45',
  'https://wir.fibery.io/Content~Marketing/139#Article/85',
  'https://wir.fibery.io/Content~Marketing/139#Article/73',
  'https://wir.fibery.io/Content~Marketing/139#Article/74',
  'https://wir.fibery.io/Content~Marketing/139#Article/88',
  'https://wir.fibery.io/Content~Marketing/139#Article/90',
  'https://wir.fibery.io/Content~Marketing/139#Article/89',
  'https://wir.fibery.io/Content~Marketing/139#Article/86',
  'https://wir.fibery.io/Content~Marketing/139#Article/91',
];

const mockRes = {
  status: () => ({
    json: noop,
  }),
};

const initArticles = metadataTestingUser =>
  Promise.all(
    INIT_ARTICLES.map(url =>
      fiberyImport(
        {
          body: { url },
          user: metadataTestingUser,
        },
        mockRes,
        err => {
          if (err) {
            throw err;
          }
        }
      )
    )
  );

const initDiaries = () =>
  Promise.all(initData.diaries.map(async diaryData => new Diary(diaryData).save()));

export const initMainPageState = async metadataTestingUser => {
  const articles = await Article.find();
  const topics = await Topic.find().exec();
  const tags = await Tag.find().exec();
  const tagsBySlug = keyBy(tags, 'slug');
  const articlesByTag = getArticlesByTag({ articles, tags });
  const { personalities = [], locations = [] } = getTagsByTopic({ tags, topics });

  const hasPersonalities = personalities.length > 2;
  if (!hasPersonalities) {
    console.log(`Not enoght personalities tags ${personalities.length}/3!`);
  }

  const hasLocations = locations.length > 2;
  if (!hasLocations) {
    console.log(`Not enoght locations tags ${locations.length}/3!`);
  }

  const state = {
    blocks: [
      { type: 'featured', articleId: null, frozen: false },
      { type: 'diary' },
      {
        type: 'latestArticles',
        articlesIds: [{ id: getId(sample(articles)), frozen: true }, { id: null, frozen: false }],
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
      // to add "banner" block here.
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
      tags: mapIds(tags),
    },
  };

  return StorageEntity.setValue(MAIN_PAGE_KEY, state, getId(metadataTestingUser));
};

const initSidebarState = async metadataTestingUser => {
  const tags = await Tag.find();
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
    getData();

    await connectDb();
    await mongoose.connection.db.dropDatabase();
    console.log('Mongoose: drop database');

    await initUsers();
    console.log(`Mongoose: insert ${await User.countDocuments()} user(s)`);

    const metadataTestingUser = await retrieveMetadataTestingUser();
    const commonMetadata = getInitObjectMetadata(metadataTestingUser);
    const topics = await addTopics(commonMetadata);
    console.log(`Mongoose: insert ${topics.length} topic(s)`);

    await initArticles(metadataTestingUser);
    const articlesCount = await Article.countDocuments();
    console.log(`Mongoose: insert ${articlesCount} article(s)`);
    console.log(
      `Mongoose: insert ${await ArticleCollection.countDocuments()} article collection(s)`
    );

    await initDiaries();
    console.log(`Mongoose: insert ${await Diary.countDocuments()} diary(es)`);
    console.log(`Mongoose: insert ${await Tag.countDocuments()} tags;`);

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

run();
