/* eslint-disable no-console */

import mongoose from 'mongoose';
import omit from 'lodash/omit';
import pick from 'lodash/pick';

import connectDb from 'db';
import { User } from 'api/user';
import { Article, ArticleBrand, ArticleCollection, LocalizedArticle } from 'api/article';
import { Diary } from 'api/specials';
import * as permissions from 'constants/permissions';

import usersData from 'db/data/users.json';
import articleBrandsData from 'db/data/articleBrands.json';
import articleCollectionsData from 'db/data/articleCollections.json';
import articlesData from 'db/data/articles.json';
import diariesData from 'db/data/diary.json';

const TEXT_BY_LOCALE = {
  be: 'Здароў!',
  ru: 'Приветик!',
  en: 'Hello!',
};

const getArticleContent = locale => ({
  entityMap: {
    '0': { type: 'LINK', mutability: 'MUTABLE', data: { url: 'http://wir.by/' } },
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
      text: 'link to wir by',
      type: 'blockquote',
      depth: 0,
      inlineStyleRanges: [],
      entityRanges: [{ offset: 0, length: 14, key: 0 }],
      data: {},
    },
  ],
});

const initUsers = () =>
  Promise.all(
    usersData.map(async userData => {
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
    articleBrandsData.map(async articleBrandData => new ArticleBrand(articleBrandData).save())
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

const initArticles = (articleBrandsDict, authorsDict) =>
  Promise.all(
    articlesData.map(async rawArticleData => {
      const articleLocales = rawArticleData.locales;
      const articleData = omit(rawArticleData, ['locales']);
      articleData.brand = articleBrandsDict[articleData.brand];
      if (articleData.authorEmail) {
        articleData.author = authorsDict[articleData.authorEmail];
      }
      if (articleData.publishAt) {
        articleData.publishAt = new Date(articleData.publishAt);
      }
      const article = new Article(articleData);
      Promise.all(
        Object.keys(articleLocales).map(locale => {
          const data = new LocalizedArticle({
            ...articleLocales[locale],
            locale,
            articleId: article._id,
            content: getArticleContent(locale),
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

  return Promise.all(articleCollectionsData.map(createCollection));
};

const initDiaries = () =>
  Promise.all(diariesData.map(async diaryData => new Diary(diaryData).save()));

(async () => {
  try {
    await connectDb();
    await mongoose.connection.db.dropDatabase();
    console.log('Mongoose: drop database');

    await initUsers();
    const usersCount = await User.count();
    console.log(`Mongoose: insert ${usersCount} user(s)`);

    await initArticleBrands();
    const articleBrandsCount = await ArticleBrand.count();
    console.log(`Mongoose: insert ${articleBrandsCount} article brand(s)`);

    const articleBrandsDict = await getArticleBrandsDict();
    const authorsDict = await getAuthorsDict();

    await initArticles(articleBrandsDict, authorsDict);
    const articlesCount = await Article.count();
    console.log(`Mongoose: insert ${articlesCount} article(s)`);
    const articleDict = await getArticlesDict();

    await initArticleCollections(articleDict);
    const articleCollectionsCount = await ArticleCollection.count();
    console.log(`Mongoose: insert ${articleCollectionsCount} article collection(s)`);

    await initDiaries();
    const diariesCount = await Diary.count();
    console.log(`Mongoose: insert ${diariesCount} diary(es)`);
  } catch (err) {
    console.log('Mongoose: error during database init');
    console.error(err);
    process.exit();
  }
  process.exit();
})();
