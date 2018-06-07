/* eslint-disable no-console */

import mongoose from 'mongoose';
import connectDb from 'db';
import { Diary } from 'api/specials';

const keyBy = require('lodash/keyBy');
const pick = require('lodash/pick');

const GoogleSpreadsheet = require('google-spreadsheet');

const doc = new GoogleSpreadsheet('1ZZ5vdgF_OgSKQWy_uY2rw37aydibdNWNOM_W7xi3rd4');

const months = {
  студзень: '01',
  чэрвень: '06',
};

let diariesPushed = 0;
const diariesFailed = 0;

const fieldsRequired = ['day', 'locale', 'author', 'text', 'active'];
const fieldsOptional = ['year'];

(async () => {
  try {
    await connectDb();

    try {
      await mongoose.connection.db.dropCollection('diaries');
    } catch (e) {
      if (e.code === 26) {
        console.log('namespace %s not found DIARY');
      } else {
        throw e;
      }
    }

    console.log('All previous diaries dropped.');

    await new Promise(globalResolve => {
      doc.getInfo((err, info) => {
        const sheets = pick(keyBy(info.worksheets, 'title'), Object.keys(months));
        console.log('OLOLO');

        Promise.all(
          Object.values(sheets).map(
            sheet =>
              new Promise(resolve => {
                console.log('111');
                const month = sheet.title;
                console.log('MONTH', month);
                const promises = [];
                sheet.getRows({}, (error, rows) => {
                  rows.forEach(async row => {
                    const diaryData = pick(row, [...fieldsRequired, ...fieldsOptional]);
                    console.log('ONE DIARY', diaryData);
                    // TODO: to check fieldsRequired

                    diaryData.colloquialDateHash = months[month] + diaryData.day;

                    promises.push(new Diary(diaryData).save());

                    diariesPushed += 1;
                  });
                  resolve(Promise.all(promises));
                });
              })
          )
        ).then(() => {
          console.log('=== DIARIES INITIALIZED ===');
          console.log('successfully: ', diariesPushed);
          console.log('failed:       ', diariesFailed);
        });
      });
      globalResolve();
    });

    const diariesCount = await Diary.count();
    console.log(`Mongoose: insert ${diariesCount} diaries`);
  } catch (err) {
    console.log('Mongoose: error during database init');
    console.error(err);
    process.exit();
  }
  process.exit();
})();
