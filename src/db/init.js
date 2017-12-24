/* eslint-disable no-console */

import mongoose from 'mongoose';

import connectDb from 'db';
import { User } from 'api/user';
import { Article, ArticleType } from 'api/article';
import usersData from './users.json';
import articleTypesData from './articletypes.json';
import articlesData from './articles.json';

const initUsers = () =>
  Promise.all(
    usersData.map(async userData => {
      const user = new User(userData);
      await user.setPassword(userData.password);
      return user.save();
    })
  );

const initArticleTypes = () =>
  Promise.all(
    articleTypesData.map(async articleTypeData => {
      const articleType = new ArticleType(articleTypeData);
      return articleType.save();
    })
  );

const getArticleTypesDict = async () => {
  const articleTypesDict = {};
  const articleTypes = await ArticleType.find().exec();
  await articleTypes.forEach(item => {
    // eslint-disable-next-line no-underscore-dangle
    articleTypesDict[item.name] = item._id;
  });
  return articleTypesDict;
};

const initArticles = articleTypesDict =>
  Promise.all(
    articlesData.map(async rawArticleData => {
      const articleData = { ...rawArticleData };
      articleData.type = articleTypesDict[articleData.type];
      if (articleData.publishAt) {
        articleData.publishAt = new Date(articleData.publishAt);
      }
      const article = new Article(articleData);
      return article.save();
    })
  );

(async () => {
  try {
    await connectDb();
    await mongoose.connection.db.dropDatabase();
    console.log('Mongoose: drop database');

    await initUsers();
    const users = await User.count();
    console.log(`Mongoose: insert ${users} users`);

    await initArticleTypes();
    const articleTypes = await ArticleType.count();
    console.log(`Mongoose: insert ${articleTypes} article type(s)`);
    const articleTypesDict = await getArticleTypesDict();

    await initArticles(articleTypesDict);
    const articles = await Article.count();
    console.log(`Mongoose: insert ${articles} articles`);
  } catch (err) {
    console.log('Mongoose: error during database init');
    console.error(err);
    process.exit();
  }
  process.exit();
})();
