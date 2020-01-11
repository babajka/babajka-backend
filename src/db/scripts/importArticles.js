/* eslint-disable no-console */

import connectDb from 'db';
import { fiberyImport } from 'api/article/controller';

import { retrieveMetadataTestingUser, mockRes } from './utils';

export const INIT_ARTICLES_FIBERY_ID = {
  belkino1: 38,
  budynki: 45,
  kashubian: 85,
  rusyn: 73,
  silesian: 74,
  sorbian: 88,
  shoes: 90,
  dali: 89,
  dubouka: 86,
  kafka: 91,
  somin: 99,
  dushy: 69,
  banksy: 183,
};

const importArticles = metadataTestingUser =>
  Promise.all(
    Object.values(INIT_ARTICLES_FIBERY_ID).map(fId =>
      fiberyImport(
        {
          body: { url: `https://wir.fibery.io/Content~Marketing/139#Article/${fId}` },
          user: metadataTestingUser,
        },
        mockRes,
        err => {
          if (err) {
            throw err;
          }
        }
      )
    )
  );

const run = async () => {
  await connectDb();
  const metadataTestingUser = await retrieveMetadataTestingUser();
  await importArticles(metadataTestingUser);
  console.log(`Mongoose: update ${Object.keys(INIT_ARTICLES_FIBERY_ID).length} articles`);
  process.exit();
};

if (require.main === module) {
  run();
}

export default importArticles;
