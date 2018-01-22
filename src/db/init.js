/* eslint-disable no-console */

import mongoose from 'mongoose';
import omit from 'lodash/omit';
import pick from 'lodash/pick';

import connectDb from 'db';
import { User } from 'api/user';
import { Article, ArticleBrand, ArticleCollection, LocalizedArticle } from 'api/article';
import * as permissions from 'constants/permissions';

import usersData from './users.json';
import articleBrandsData from './articleBrands.json';
import articleCollectionsData from './articleCollections.json';
import articlesData from './articles.json';

const initUsers = () =>
  Promise.all(
    usersData.map(async userData => {
      const permPreset = userData.permissionsPreset || 'user';

      const user = new User(userData);
      user.permissions = {};
      permissions[permPreset].forEach(perm => {
        user.permissions[perm] = true;
      });

      if (userData.role !== 'author') {
        await user.setPassword(userData.password);
      }
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
    articleBrandsDict[item.slug] = item._id;
  });
  return articleBrandsDict;
};

const initArticles = articleBrandsDict =>
  Promise.all(
    articlesData.map(async rawArticleData => {
      const articleLocales = rawArticleData.locales;
      const articleData = omit(rawArticleData, ['locales']);
      articleData.brand = articleBrandsDict[articleData.brand];
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
  const articles = await Article.find().exec();
  await articles.forEach(item => {
    articlesDict[item.slug] = item._id;
  });
  return articlesDict;
};

const initArticleCollections = articlesDict => {
  const createCollection = async collectionData => {
    const subDict = pick(articlesDict, collectionData.articleSlugs);
    const body = { ...collectionData, articles: Object.values(subDict) };
    const collection = await new ArticleCollection(body).save();

    const articles = Object.keys(subDict).map(slug =>
      Article.findOneAndUpdate({ slug }, { collectionId: collection._id })
    );
    Promise.all(articles);
  };

  return Promise.all(articleCollectionsData.map(createCollection));
};

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
    const articleDict = await getArticlesDict();

    await initArticleCollections(articleDict);
    const articleCollections = await ArticleCollection.count();
    console.log(`Mongoose: insert ${articleCollections} article collection(s)`);
  } catch (err) {
    console.log('Mongoose: error during database init');
    console.error(err);
    process.exit();
  }
  process.exit();
})();
