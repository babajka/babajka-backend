/* eslint-disable no-console */

import * as db from 'src/db';

Promise.resolve(db.connectDb())
  .then(mongoose => db.dropCollections(mongoose))
  .then((collections) => {
    console.log(`Mongoose: drop ${collections.length} collections: ${collections}`);
  })
  .then(() => process.exit())
  .catch((err) => {
    console.log('Mongoose: error during database init');
    console.error(err);
    process.exit();
  });
