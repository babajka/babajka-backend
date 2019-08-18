/* eslint-disable no-console */

// The script fetches Tags from Google Spreadsheet and updates DB accordingly.
// The script creates new tags and updates existing ones using slug as a primary key.
// The topic can be updated by moving a Tag from one tab to another.
// The slug cannot be updated using this script.
// The script never removes Tags from DB. One should do that manually.

// Usage examples:
// * npm run fetch-tags
// * npm run fetch-tags -- secret-dev.json

import Joi from 'utils/joi';

import Tag from 'api/tag/model';
import Topic from 'api/topic/model';

import { TAG_CONTENT_SCHEMA } from 'constants/topic';

import connectDb from 'db';

const keyBy = require('lodash/keyBy');
const set = require('lodash/set');
const isEqual = require('lodash/isEqual');
const omit = require('lodash/omit');
const uniq = require('lodash/uniq');
const difference = require('lodash/difference');
const flatten = require('lodash/flatten');

const GoogleSpreadsheet = require('google-spreadsheet');

const doc = new GoogleSpreadsheet('1GxVDSZOWyGvtXa_dwmaRcjzWrXq_kjgXCmZEJVrgb10');

const locales = ['be', 'en', 'ru'];

const tagScopes = {
  themes: { localized: ['title'], unlocalized: [] },
  locations: { localized: ['title'], unlocalized: ['image'] },
  times: { localized: ['title'], unlocalized: [] },
  personalities: {
    localized: ['name', 'dates', 'description'],
    unlocalized: ['color', 'image'],
  },
  brands: {
    localized: ['title'],
    unlocalized: ['image'],
  },
  authors: {
    localized: ['name', 'bio'],
    unlocalized: ['image'],
  },
  // In addition to those specified explicitly, each Tag also has unlocalized slug.
};

const parseSheet = (sheet, scopesLocalized = [], scopesUnlocalized = []) =>
  new Promise(resolve => {
    const result = [];
    sheet.getRows({}, (error, rows) => {
      rows.shift(); // This removes the "comment" row.
      rows.forEach(row => {
        const data = {};
        scopesUnlocalized.forEach(scope => {
          const value = row[scope];
          if (value) {
            set(data, scope, value);
          }
        });
        locales.forEach(locale => {
          scopesLocalized.forEach(scope => {
            const value = row[`${scope}.${locale}`];
            if (value) {
              set(data, [scope, locale], value);
            }
          });
        });
        result.push(data);
      });
      resolve(result);
    });
  });

const getDB = async () => {
  const topics = keyBy(await Topic.find({}).select('slug'), 'slug');
  const tags = await Tag.find({});
  return { topics, tags };
};

const getSheetsData = async info => {
  const data = {};

  const sheets = keyBy(info.worksheets, 'title');

  await Promise.all(
    Object.entries(tagScopes).map(([topic, details]) =>
      parseSheet(sheets[topic], details.localized, ['slug', ...details.unlocalized]).then(
        tagRawData => {
          data[topic] = tagRawData;
        }
      )
    )
  );

  return data;
};

const validateSheetsData = sheetsData => {
  const allTags = flatten(
    Object.entries(sheetsData).map(([topic, tags]) => {
      const topicTags = tags.map(tagData => {
        if (!tagData.slug) {
          throw new Error(`TOPIC: ${topic}, SLUG is missing for one of the objects`);
        }
        const { error } = Joi.validate(omit(tagData, ['slug']), TAG_CONTENT_SCHEMA[topic]);
        if (error !== null) {
          throw new Error(`TOPIC: ${topic}, SLUG: ${tagData.slug}, ${error}`);
        }
        return tagData.slug;
      });

      console.log(`  [OK] ${topic} : `, topicTags);

      return topicTags;
    })
  );

  if (allTags.length !== uniq(allTags).length) {
    throw new Error('it seems like there are slug duplicates in the Spreadsheet');
  }

  return allTags;
};

const updateTags = async (sheetsData, db) => {
  const promises = flatten(
    Object.entries(sheetsData).map(([topic, tags]) =>
      tags.map(tag =>
        Tag.updateOne(
          { slug: tag.slug },
          // TODO: to update metadata. This is unclear due to an absense of explicit user.
          { content: omit(tag, ['slug']), topic: db.topics[topic] },
          { upsert: true, setDefaultsOnInsert: true, runValidators: true }
        ).exec()
      )
    )
  );

  console.log(`[OK] ${promises.length} tags are ready for being created/updated`);

  await Promise.all(promises);
};

doc.getInfo(async (_, info) => {
  try {
    await connectDb();

    const db = await getDB();

    if (!isEqual(Object.keys(db.topics).sort(), Object.keys(tagScopes).sort())) {
      throw new Error('topics in DB do not exactly match topic list from script');
    }
    console.log('[OK] Topics in DB.');

    db.tagsList = db.tags.map(({ slug }) => slug);
    console.log(`[OK] Tags (all: ${db.tagsList.length}) in DB:`, db.tagsList);

    const sheetsData = await getSheetsData(info);
    console.log('[OK] Received data from Google Spreadsheet.');
    const allSheetTags = validateSheetsData(sheetsData);
    console.log(
      `[OK] Validation was successful. Total number of Tags in the Spreadsheet: ${
        allSheetTags.length
      }`
    );

    const tagsDiff = difference(db.tagsList, allSheetTags);
    if (tagsDiff.length) {
      console.log('Unexpected tags in DB:', tagsDiff);
      throw new Error('some tags are expected to be MANUALLY REMOVED from DB');
    }
    console.log('[OK] Tags are consistent between DB and Spreadsheet');

    await updateTags(sheetsData, db);
    console.log('[OK] All tags are processed. Hooray!');

    // PLACEHOLDER.
  } catch (err) {
    console.error(`SCRIPT FAILURE: ${err}`);
  }
  process.exit();
});
