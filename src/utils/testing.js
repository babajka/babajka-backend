// The file is excluded from the build and must only contain utils used by testing.

/* eslint-disable import/no-extraneous-dependencies */

import mongoose from 'mongoose';
import supertest from 'supertest';
import chai from 'chai';
import dirtyChai from 'dirty-chai';

import app from 'server';
import * as permissions from 'constants/permissions';

import Article from 'api/article/article.model';
import ArticleBrand from 'api/article/brand/model';
import LocalizedArticle from 'api/article/localized/model';
import User from 'api/user/model';

const { expect } = chai;
chai.use(dirtyChai);

export const dropData = () => mongoose.connection.db.dropDatabase();

const request = supertest.agent(app.listen());

const testData = {
  users: {
    admin: {
      firstName: 'Name',
      email: 'admin@babajka.io',
      password: 'password',
      permissions: permissions.admin,
    },
    author: {
      firstName: { be: 'FirstName-be', en: 'FirstName-en' },
      email: 'author@babajka.io',
      password: 'password',
      permissions: permissions.author,
      role: 'author',
    },
  },
  brands: {
    default: {
      slug: 'wir',
    },
  },
};

export const addUser = async data => {
  const user = new User(data);
  await user.setPassword(data.password);
  await user.save();
  return user;
};

export const addAdminUser = () => addUser(testData.users.admin);

export const addAuthorUser = () => addUser(testData.users.author);

export const testLogin = ({ email, password }) =>
  request
    .post('/auth/login')
    .send({ email, password })
    .expect(200)
    .then(res => {
      expect(res.headers['set-cookie']).not.empty();
      return res.headers['set-cookie'];
    });

export const loginTestAdmin = async () => {
  await addUser(testData.users.admin);
  return testLogin(testData.users.admin);
};

export const defaultObjectMetadata = async () => {
  const admin = await User.findOne({ email: testData.users.admin.email }).exec();
  return {
    createdAt: Date.now(),
    createdBy: admin._id,
    updatedAt: Date.now(),
    updatedBy: admin._id,
  };
};

export const addBrand = () => new ArticleBrand(testData.brands.default).save();

// TODO: this method could benefit from refactoring. To consider.
export const addArticles = async (articleBrandId, numberPublished, numberUnpublished) => {
  let promises = [];

  const articles = [];

  const defaultMetadata = await defaultObjectMetadata();

  const totalNumber = numberPublished + numberUnpublished;

  for (let i = 1; i <= totalNumber; i += 1) {
    const passedDate = new Date(`2017-11-02T1${i}:25:43.511Z`);
    const futureDate = new Date(`2027-11-02T1${i}:25:43.511Z`);
    const date = i <= numberPublished ? passedDate : futureDate;

    promises.push(
      new Article({
        brand: articleBrandId,
        type: 'text',
        imagePreviewUrl: 'image-url',
        metadata: defaultMetadata,
        publishAt: date,
      })
        .save()
        .then(({ _id }) => {
          articles.push({ _id, publishAt: date });
        })
    );
  }
  await Promise.all(promises);

  articles.sort((a, b) => {
    if (a.publishAt < b.publishAt) {
      return -1;
    }
    if (a.publishAt > b.publishAt) {
      return 1;
    }
    return 0;
  });

  promises = [];
  ['en', 'be'].forEach(loc => {
    for (let i = 1; i <= totalNumber; i += 1) {
      promises.push(
        new LocalizedArticle({
          locale: `${loc}`,
          title: `title-${i}-${loc}`,
          subtitle: `subtitle-${i}-${loc}`,
          slug: i <= numberPublished ? `article-${i}-${loc}` : `article-draft-${i}-${loc}`,
          articleId: articles[i - 1]._id,
          metadata: defaultMetadata,
        })
          .save()
          .then(locArticle => {
            articles[i - 1][loc] = locArticle;
            return locArticle;
          })
          // eslint-disable-next-line no-loop-func
          .then(({ _id, articleId }) =>
            Article.findOneAndUpdate({ _id: articleId }, { $push: { locales: _id } }).exec()
          )
      );
    }
  });
  await Promise.all(promises);

  return articles;
};

export { expect, supertest };
