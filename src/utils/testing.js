// The file is excluded from the build and must only contain utils used by testing.

/* eslint-disable import/no-extraneous-dependencies */

import mongoose from 'mongoose';
import supertest from 'supertest';
import chai from 'chai';
import dirtyChai from 'dirty-chai';
import spies from 'chai-spies';
import flatten from 'lodash/flatten';
import HttpStatus from 'http-status-codes';

import app from 'server';
import * as permissions from 'constants/permissions';
import { TOPIC_SLUGS } from 'constants/topic';

import Article from 'api/article/article.model';
import LocalizedArticle from 'api/article/localized/model';
import User from 'api/user/model';
import Tag from 'api/tag/model';
import Topic from 'api/topic/model';
import { getId } from 'utils/getters';

chai.use(dirtyChai);
chai.use(spies);
const { expect, spy } = chai;

export const dropData = () => mongoose.connection.db.dropDatabase();

const request = supertest.agent(app.listen());

export const IMAGE_URL =
  'http://res.cloudinary.com/dhgy4yket/image/upload/v1522525517/babajka-dev/kino.jpg';
const YOUTUBE_ID = 'ABCABCABCAB';
const YOUTUBE_LINK = `https://www.youtube.com/watch?v=${YOUTUBE_ID}`;
export const TEST_DATA = {
  imageUrl: IMAGE_URL,
  youtubeId: YOUTUBE_ID,
  youtubeLink: YOUTUBE_LINK,
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
        fiberyId: 'testTag-albert',
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
          image: IMAGE_URL,
        },
      },
    },
    personalities: {
      default: {
        fiberyId: 'testTag-karatkevich',
        slug: 'karatkevich',
        content: {
          name: {
            be: 'Уладзімір Караткевіч',
          },
          subtitle: {
            be: '20 стг',
          },
          image: IMAGE_URL,
          diaryImage: IMAGE_URL,
          color: '#ff0000',
          description: {
            be: 'пісменнік',
          },
        },
      },
      kolas: {
        fiberyId: 'testTag-kolas',
        slug: 'kolas',
        content: {
          name: {
            be: 'Якуб Клас',
          },
          subtitle: {
            be: '20 стг',
          },
          image: IMAGE_URL,
          diaryImage: IMAGE_URL,
          color: '#ff0000',
          description: {
            be: 'пісменнік',
          },
        },
      },
    },
    brands: {
      default: {
        fiberyId: 'testTag-libra',
        slug: 'libra',
        content: {
          title: {
            be: 'Libra',
          },
          image: IMAGE_URL,
        },
      },
    },
    themes: {
      default: {
        fiberyId: 'testTag-history',
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
      page: IMAGE_URL,
      horizontal: IMAGE_URL,
      vertical: IMAGE_URL,
    },
    video: {
      page: IMAGE_URL,
      horizontal: IMAGE_URL,
      vertical: IMAGE_URL,
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
    .expect(HttpStatus.OK)
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
        fiberyId: `article${i}`,
        fiberyPublicId: `${i}`,
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
            text: { some: 'content' },
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

const addTag = (metadata, topicSlug, key = 'default') =>
  Topic.findOne({ slug: topicSlug }).then(topic => {
    const { fiberyId, slug, content } = TEST_DATA.tags[topicSlug][key];
    return Tag({
      fiberyId,
      topic: getId(topic),
      topicSlug,
      slug,
      content,
      metadata,
    }).save();
  });

export const addAuthorsTag = metadata => addTag(metadata, 'authors');

export const addPersonalityTag = (metadata, key) => addTag(metadata, 'personalities', key);

export const addBrandsTag = metadata => addTag(metadata, 'brands');

export const addThemesTag = metadata => addTag(metadata, 'themes');

export { expect, supertest, spy };
