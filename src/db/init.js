/* eslint-disable no-console */

import mongoose from 'mongoose';
import assign from 'lodash/assign';
import omit from 'lodash/omit';

import connectDb from 'db';
import { User } from 'api/user';
import { Article, ArticleBrand, ArticleCollection } from 'api/article';
import * as permissions from 'constants/permissions';

import usersData from './users.json';
import articleBrandsData from './articleBrands.json';
import articleCollectionsData from './articleCollections.json';
import articlesData from './articles.json';

const initUsers = () =>
  Promise.all(
    usersData.map(async userData => {
      const role = userData.role || 'user';

      const user = new User(omit(userData, ['role']));
      user.permissions = {};
      permissions[role].forEach(perm => {
        user.permissions[perm] = true;
      });

      await user.setPassword(userData.password);
      return user.save();
    })
  );

const initArticleBrands = () =>
  Promise.all(
    articleBrandsData.map(async articleBrandData => {
      const articleBrand = new ArticleBrand(articleBrandData);
      return articleBrand.save();
    })
  );

const getArticleBrandsDict = async () => {
  const articleBrandsDict = {};
  const articleBrands = await ArticleBrand.find().exec();
  await articleBrands.forEach(item => {
    // eslint-disable-next-line no-underscore-dangle
    articleBrandsDict[item.name] = item._id;
  });
  return articleBrandsDict;
};

const initArticles = articleBrandsDict =>
  Promise.all(
    articlesData.map(async rawArticleData => {
      const articleData = { ...rawArticleData };
      articleData.brand = articleBrandsDict[articleData.brand];
      if (articleData.publishAt) {
        articleData.publishAt = new Date(articleData.publishAt);
      }
      const article = new Article(articleData);
      return article.save();
    })
  );

const initArticleCollections = () =>
  Promise.all(
    articleCollectionsData.map(async articleCollectionData => {
      const articleIds = articleCollectionData.articleSlugs.map(
        // eslint-disable-next-line no-underscore-dangle
        slug => Article.findOne({ slug })._id
      );

      const collection = new ArticleCollection(
        assign(omit(articleCollectionData, ['articleSlugs']), { articles: articleIds })
      );

      return collection.save();
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

    await initArticleBrands();
    const articleBrands = await ArticleBrand.count();
    console.log(`Mongoose: insert ${articleBrands} article brand(s)`);
    const articleBrandsDict = await getArticleBrandsDict();

    await initArticles(articleBrandsDict);
    const articles = await Article.count();
    console.log(`Mongoose: insert ${articles} articles`);

    await initArticleCollections();
    const articleCollections = await ArticleCollection.count();
    console.log(`Mongoose: insert ${articleCollections} article collection(s)`);
  } catch (err) {
    console.log('Mongoose: error during database init');
    console.error(err);
    process.exit();
  }
  process.exit();
})();
