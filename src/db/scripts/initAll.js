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

import mongoose from 'mongoose';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import isEmpty from 'lodash/isEmpty';
import keyBy from 'lodash/keyBy';
import sampleSize from 'lodash/sampleSize';
import fs from 'fs';
import path from 'path';

import connectDb from 'db';
import { User } from 'api/user';
import { Article, ArticleBrand, ArticleCollection, LocalizedArticle } from 'api/article';
import { StorageEntity } from 'api/storage/model';
import { Diary } from 'api/specials';
import { Tag } from 'api/tag';
import { getInitObjectMetadata } from 'api/helpers/metadata';
import * as permissions from 'constants/permissions';
import { MAIN_PAGE_KEY } from 'constants/storage';
import { addTopics } from 'utils/testing';

const defaultDataPath = `${__dirname}/../data/`;
const dataFilenames = {
  users: 'users.json',
  articleBrands: 'articleBrands.json',
  articleCollections: 'articleCollections.json',
  articles: 'articles.json',
  diaries: 'diary.json',
  tags: 'tags.json',
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

const TEXT_BY_LOCALE = {
  be: 'Гэта дэфолтны загаловак пустога артыкула',
  ru: 'Это дефолтный заголовок пустой статьи',
  en: 'This is a default header of an empty article',
};

const getArticleContent = locale => ({
  entityMap: {
    '0': {
      type: 'LINK',
      mutability: 'MUTABLE',
      data: { url: 'http://dev.wir.by/be/article/dushy' },
    },
  },
  blocks: [
    {
      key: '761n6',
      text: TEXT_BY_LOCALE[locale],
      type: 'header-one',
      depth: 0,
      inlineStyleRanges: [],
      entityRanges: [],
      data: {},
    },
    {
      key: 'cuvud',
      text: 'CLICK HERE TO CHECK A SAMPLE ARTICLE OUT.',
      type: 'blockquote',
      depth: 0,
      inlineStyleRanges: [],
      entityRanges: [{ offset: 0, length: 41, key: 0 }],
      data: {},
    },
  ],
});

const initUsers = () =>
  Promise.all(
    initData.users.map(async userData => {
      const permPreset = userData.permissionsPreset || 'user';

      const user = new User(userData);
      user.permissions = permissions[permPreset];

      if (userData.role !== 'author') {
        await user.setPassword(userData.password);
      }
      return user.save();
    })
  );

const initArticleBrands = () =>
  Promise.all(
    initData.articleBrands.map(async articleBrandData => new ArticleBrand(articleBrandData).save())
  );

const getArticleBrandsDict = async () => {
  const articleBrandsDict = {};
  const articleBrands = await ArticleBrand.find().exec();
  await articleBrands.forEach(item => {
    articleBrandsDict[item.slug] = item._id;
  });
  return articleBrandsDict;
};

const getAuthorsDict = async () => {
  const authorsDict = {};
  const authors = await User.find({ role: 'author' }).exec();
  await authors.forEach(author => {
    authorsDict[author.email] = author._id;
  });
  return authorsDict;
};

const retrieveMetadataTestingUser = async () => {
  const testingUser = await User.findOne({ email: 'admin@babajka.io' });
  return testingUser;
};

const initArticles = (articleBrandsDict, authorsDict, metadataTestingUser) =>
  Promise.all(
    initData.articles.map(async rawArticleData => {
      const commonMetadata = getInitObjectMetadata(metadataTestingUser);

      const articleLocales = rawArticleData.locales;
      const articleData = omit(rawArticleData, ['locales', 'videoId']);
      articleData.brand = articleBrandsDict[articleData.brand];
      articleData.metadata = commonMetadata;
      if (articleData.authorEmail) {
        articleData.author = authorsDict[articleData.authorEmail];
      }
      if (articleData.publishAt) {
        articleData.publishAt = new Date(articleData.publishAt);
      }
      if (articleData.type === 'video') {
        articleData.video = {
          platform: 'youtube',
          videoId: rawArticleData.videoId,
          videoUrl: `https://www.youtube.com/watch?v=${rawArticleData.videoId}`,
        };
      }
      const article = new Article(articleData);
      Promise.all(
        Object.keys(articleLocales).map(locale => {
          if (isEmpty(articleLocales[locale].content)) {
            articleLocales[locale].content = getArticleContent(locale);
          }
          const data = new LocalizedArticle({
            ...articleLocales[locale],
            locale,
            articleId: article._id,
            metadata: commonMetadata,
          });
          article.locales.push(data._id);
          return data.save();
        })
      );
      return article.save();
    })
  );

// Returns a mapping of slugs to id-s.
const getArticlesDict = async () => {
  const articlesDict = {};
  const articles = await Article.find().populate('locales', ['slug']);
  await articles.forEach(item => {
    item.locales.forEach(localization => {
      articlesDict[localization.slug] = item._id;
    });
  });
  return articlesDict;
};

const initArticleCollections = articlesDict => {
  const createCollection = async collectionData => {
    const subDict = pick(articlesDict, collectionData.articleSlugs);
    const body = { ...collectionData, articles: Object.values(subDict) };
    const collection = await new ArticleCollection(body).save();
    await Promise.all(
      Object.values(subDict).map(id =>
        Article.findOneAndUpdate({ _id: id }, { collectionId: collection._id }).exec()
      )
    );
  };

  return Promise.all(initData.articleCollections.map(createCollection));
};

const initDiaries = () =>
  Promise.all(initData.diaries.map(async diaryData => new Diary(diaryData).save()));

const initMainPageState = metadataTestingUser =>
  Article.find()
    .then(articles => articles.map(({ _id }) => _id))
    .then(async articleIds => {
      const brandIds = await ArticleBrand.find().then(articleBrands =>
        articleBrands.map(({ _id }) => _id)
      );
      const tagIds = await Tag.find().then(tags => tags.map(({ _id }) => _id));
      return {
        articles: articleIds,
        brands: brandIds,
        tags: tagIds,
      };
    })
    .then(data =>
      StorageEntity.setValue(
        MAIN_PAGE_KEY,
        { blocks: [{ type: 'featured' }, { type: 'diary' }], data },
        metadataTestingUser._id
      )
    );

const initTags = async metadataTestingUser => {
  const commonMetadata = getInitObjectMetadata(metadataTestingUser);
  const topics = keyBy(await addTopics(commonMetadata), 'slug');
  const tags = await Promise.all(
    initData.tags.map(rawTagData =>
      Tag({
        ...omit(rawTagData, ['topicSlug']),
        topic: topics[rawTagData.topicSlug],
        metadata: commonMetadata,
      })
        .save()
        .then(({ _id }) => _id)
    )
  );

  // Randomly applying tags to articles.
  const articles = await Article.find({}).then(data => data.map(({ _id }) => _id));
  await Promise.all(
    articles.map(articleId =>
      Article.findOneAndUpdate({ _id: articleId }, { tags: sampleSize(tags, 2) })
    )
  );

  return tags.length;
};

(async () => {
  try {
    getData();

    await connectDb();
    await mongoose.connection.db.dropDatabase();
    console.log('Mongoose: drop database');

    await initUsers();
    const usersCount = await User.countDocuments();
    console.log(`Mongoose: insert ${usersCount} user(s)`);

    await initArticleBrands();
    const articleBrandsCount = await ArticleBrand.countDocuments();
    console.log(`Mongoose: insert ${articleBrandsCount} article brand(s)`);

    const articleBrandsDict = await getArticleBrandsDict();
    const authorsDict = await getAuthorsDict();
    const metadataTestingUser = await retrieveMetadataTestingUser();

    await initArticles(articleBrandsDict, authorsDict, metadataTestingUser);
    const articlesCount = await Article.countDocuments();
    console.log(`Mongoose: insert ${articlesCount} article(s)`);
    const articleDict = await getArticlesDict();

    await initArticleCollections(articleDict);
    const articleCollectionsCount = await ArticleCollection.countDocuments();
    console.log(`Mongoose: insert ${articleCollectionsCount} article collection(s)`);

    await initDiaries();
    const diariesCount = await Diary.countDocuments();
    console.log(`Mongoose: insert ${diariesCount} diary(es)`);

    const tagsCount = await initTags(metadataTestingUser);
    console.log(`Mongoose: insert ${tagsCount} tags; all articles are randomly updated with tags`);

    await initMainPageState(metadataTestingUser);
    console.log('Mongoose: main page state pushed');

    // PLACEHOLDER.
  } catch (err) {
    console.log('Mongoose: error during database init');
    console.error(err);
    process.exit();
  }
  process.exit();
})();
