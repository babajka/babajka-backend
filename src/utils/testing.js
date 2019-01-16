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
  const defaultMetadata = await defaultObjectMetadata();
  const totalNumber = numberPublished + numberUnpublished;

  const articles = [];

  await Promise.all(
    [...Array(totalNumber).keys()].map(i => {
      const day = i < 9 ? `0${i + 1}` : i + 1;
      const passedDate = new Date(`2017-11-${day}T17:25:43.511Z`);
      const futureDate = new Date(`2027-11-${day}T16:25:43.511Z`);
      const date = i < numberPublished ? passedDate : futureDate;

      return new Article({
        brand: articleBrandId,
        type: 'text',
        imagePreviewUrl: 'image-url',
        metadata: defaultMetadata,
        publishAt: date,
      })
        .save()
        .then(({ _id }) => {
          articles.push({ _id, publishAt: date, locales: {} });
        });
    })
  );

  articles.sort((a, b) => {
    if (a.publishAt < b.publishAt) {
      return -1;
    }
    if (a.publishAt > b.publishAt) {
      return 1;
    }
    return 0;
  });

  await Promise.all(
    [...Array(totalNumber).keys()].reduce(
      (r, i) =>
        r.push(
          ...['en', 'be'].map(loc =>
            new LocalizedArticle({
              locale: `${loc}`,
              title: `title-${i + 1}-${loc}`,
              subtitle: `subtitle-${i + 1}-${loc}`,
              slug:
                articles[i].publishAt < Date.now()
                  ? `article-${i + 1}-${loc}`
                  : `article-draft-${i + 1}-${loc}`,
              articleId: articles[i]._id,
              metadata: defaultMetadata,
            })
              .save()
              .then(locArticle => {
                articles[i].locales[loc] = locArticle;
                return locArticle;
              })
              .then(({ _id, articleId }) =>
                Article.findOneAndUpdate({ _id: articleId }, { $push: { locales: _id } }).exec()
              )
          )
        ) && r,
      []
    )
  );

  return articles;
};

export { expect, supertest };
