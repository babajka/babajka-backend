/* eslint-disable no-console */

import * as db from './src/db';

const connector = db.connectDb();

connector.promise
  .then(() => db.dropCollections(connector.mongoose.connection))
  .then((collections) => {
    console.log(`Mongoose: drop ${collections.length} collections: ${collections}`);
  })
  .then(() => process.exit())
  .catch((err) => {
    console.log('Mongoose: error during database init');
    console.error(err);
    process.exit();
  });
