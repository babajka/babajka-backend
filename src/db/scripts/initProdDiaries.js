/* eslint-disable no-console */

// Example of a run:
//   npm run init-prod-diaries -- path-to-secret-file
// 'path-to-secret-file' defines which database is about to be modified.
// To work locally run:
//   npm run init-prod-diaries

import mongoose from 'mongoose';
import connectDb from 'db';
import { Diary } from 'api/specials';

const keyBy = require('lodash/keyBy');
const pick = require('lodash/pick');
const difference = require('lodash/difference');
const map = require('lodash/map');
const cloneDeep = require('lodash/cloneDeep');

const GoogleSpreadsheet = require('google-spreadsheet');

const doc = new GoogleSpreadsheet('1ZZ5vdgF_OgSKQWy_uY2rw37aydibdNWNOM_W7xi3rd4');

const months = {
  студзень: '01',
  люты: '02',
  сакавік: '03',
  красавік: '04',
  травень: '05',
  чэрвень: '06',
  ліпень: '07',
  жнівень: '08',
  верасень: '09',
  кастрычнік: '10',
  лістапад: '11',
  снежань: '12',
};

const fieldsRequired = ['day', 'locale', 'author', 'text'];
const fieldsOptional = ['active', 'year'];

(async () => {
  try {
    await connectDb();

    try {
      await mongoose.connection.db.dropCollection('diaries');
    } catch (e) {
      if (e.code === 26) {
        console.log('Diaries were not dropped due to the absence of the collection');
      } else {
        throw e;
      }
    }

    console.log('DB is free of any diaries');

    doc.getInfo((err, info) => {
      const sheets = pick(keyBy(info.worksheets, 'title'), Object.keys(months));

      // A piece of code below is to add a diary for each day of the year,
      // even if some months are missing in the spreadsheet.
      // This works inaccurately with calendar e.g. it may add February 31 which does not exist.
      // This was added for testing and presentation purposes and should not be used
      // to prepopulate production diaries.
      const missingMonths = difference(Object.keys(months), map(info.worksheets, 'title'));
      missingMonths.forEach(mMonth => {
        sheets[mMonth] = cloneDeep(sheets['жнівень']);
        sheets[mMonth].title = mMonth;
      });

      let diariesPushed = 0;
      let diariesFailed = 0;

      Promise.all(
        Object.values(sheets).map(
          sheet =>
            new Promise(resolve => {
              const month = sheet.title;
              const promises = [];
              sheet.getRows({}, (error, rows) => {
                rows.forEach(async row => {
                  const diaryData = pick(row, [...fieldsRequired, ...fieldsOptional]);
                  const ok = fieldsRequired.every(key => !!diaryData[key]);
                  if (!ok) {
                    diariesFailed += 1;
                    return;
                  }

                  diaryData.colloquialDateHash = months[month] + diaryData.day;
                  diaryData.active = diaryData.active !== 'no';

                  diaryData.text = diaryData.text.replace('\n', '<br/>');

                  promises.push(new Diary(diaryData).save());

                  diariesPushed += 1;
                });
                resolve(Promise.all(promises));
              });
            })
        )
      ).then(async () => {
        const diariesCount = await Diary.countDocuments();

        console.log(
          `====== DIARIES SUMMARY ======\nsuccessfully: ${diariesPushed}\n` +
            `failed: ${diariesFailed}\ndb.countDocuments(): ${diariesCount}\n=============================`
        );

        process.exit();
      });
    });
  } catch (err) {
    console.error(`Init of Prod Diaries failed: ${err}`);
    process.exit();
  }
})();
