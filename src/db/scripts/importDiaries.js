/* eslint-disable no-console */

import connectDb from 'db';
import Diary from 'api/specials/diary/model';
import { fiberyImport } from 'api/specials/diary/controller';

import { retrieveMetadataTestingUser, mockRes } from './utils';

const importDiaries = metadataTestingUser =>
  fiberyImport(
    {
      user: metadataTestingUser,
    },
    mockRes,
    err => {
      if (err) {
        throw err;
      }
    }
  );

const run = async () => {
  await connectDb();
  const metadataTestingUser = await retrieveMetadataTestingUser();
  await importDiaries(metadataTestingUser);
  console.log(`Mongoose: update ${await Diary.countDocuments()} diaries`);
  process.exit();
};

if (require.main === module) {
  run();
}

export default importDiaries;
