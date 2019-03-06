// The file is excluded from the build and must only contain utils used by testing.

/* eslint-disable import/no-extraneous-dependencies */

import mongoose from 'mongoose';
import supertest from 'supertest';
import chai from 'chai';
import dirtyChai from 'dirty-chai';
import flatten from 'lodash/flatten';

import app from 'server';
import * as permissions from 'constants/permissions';
import { TOPIC_SLUGS } from 'constants/topic';

import Article from 'api/article/article.model';
import LocalizedArticle from 'api/article/localized/model';
import User from 'api/user/model';
import Tag from 'api/tag/model';
import Topic from 'api/topic/model';

const { expect } = chai;
chai.use(dirtyChai);

export const dropData = () => mongoose.connection.db.dropDatabase();

const request = supertest.agent(app.listen());

export const TEST_DATA = {
  users: {
    admin: {
      firstName: 'Name',
      email: 'admin@babajka.io',
      password: 'password',
      permissions: permissions.admin,
    },
  },
  tags: {
    authors: {
      default: {
        slug: 'albert',
        content: {
          firstName: {
            be: 'Альберт',
          },
          lastName: {
            be: 'Эйнштэйн',
          },
          bio: {
            be: 'lol',
          },
          image: 'some-url',
        },
      },
    },
    brands: {
      default: {
        slug: 'libra',
        content: {
          title: {
            be: 'Libra',
          },
          image: 'some-url',
        },
      },
    },
    themes: {
      default: {
        slug: 'history',
        content: {
          title: {
            be: 'Гісторыя',
          },
        },
      },
    },
  },
  articleImages: {
    text: {
      page: 'page-url',
      horizontal: 'horizontal-url',
      vertical: 'vertical-url',
    },
    video: {
      page: 'page-url',
      horizontal: 'horizontal-url',
    },
  },
};

export const addUser = async data => {
  const user = new User(data);
  await user.setPassword(data.password);
  await user.save();
  return user;
};

export const addAdminUser = () => addUser(TEST_DATA.users.admin);

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
  await addAdminUser();
  return testLogin(TEST_DATA.users.admin);
};

export const defaultObjectMetadata = async () => {
  const admin = await User.findOne({ email: TEST_DATA.users.admin.email }).exec();
  return {
    createdAt: Date.now(),
    createdBy: admin._id,
    updatedAt: Date.now(),
    updatedBy: admin._id,
  };
};

const normalizedDay = i => (i < 9 ? `0${i + 1}` : i + 1);

// TODO: this method could benefit from refactoring. To consider.
export const addArticles = async (numberPublished, numberUnpublished) => {
  const defaultMetadata = await defaultObjectMetadata();
  const totalNumber = numberPublished + numberUnpublished;

  const articles = await Promise.all(
    Array.from({ length: totalNumber }).map((_, i) => {
      const day = normalizedDay(i);
      const passedDate = new Date(`2017-11-${day}T17:25:43.511Z`);
      const futureDate = new Date(`2027-11-${day}T16:25:43.511Z`);
      const date = i < numberPublished ? passedDate : futureDate;

      return new Article({
        type: 'text',
        images: TEST_DATA.articleImages.text,
        metadata: defaultMetadata,
        publishAt: date,
      })
        .save()
        .then(({ _id }) => ({ _id, publishAt: date, locales: {} }));
    })
  );

  articles.sort((a, b) => a.publishAt - b.publishAt);

  await Promise.all(
    flatten(
      Array.from({ length: totalNumber }).map((_, i) =>
        ['be', 'en'].map(loc =>
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
      )
    )
  );

  return articles;
};

export const addTopics = metadata =>
  Promise.all(TOPIC_SLUGS.map(topicSlug => Topic({ slug: topicSlug, metadata }).save()));

const addTag = (metadata, topicSlug) =>
  Topic.findOne({ slug: topicSlug }).then(topic =>
    Tag({
      topic: topic._id,
      slug: TEST_DATA.tags[topicSlug].default.slug,
      content: TEST_DATA.tags[topicSlug].default.content,
      metadata,
    }).save()
  );

export const addAuthorsTag = metadata => addTag(metadata, 'authors');

export const addBrandsTag = metadata => addTag(metadata, 'brands');

export const addThemesTag = metadata => addTag(metadata, 'themes');

export { expect, supertest };
