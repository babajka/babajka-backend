/* eslint-disable no-console */

import * as db from './src/db';
import config from './src/config';

const connector = db.connectDb(config.mongodb.url, config.mongodb.options);

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
