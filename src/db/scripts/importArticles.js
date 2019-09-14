/* eslint-disable no-console */

import connectDb from 'db';
import { fiberyImport } from 'api/article/controller';

import { retrieveMetadataTestingUser, mockRes } from './utils';

const ARTICLES = [
  // belkino1
  'https://wir.fibery.io/Content~Marketing/139#Article/38',
  // 10-budynkau-minska
  'https://wir.fibery.io/Content~Marketing/139#Article/45',
  // kashubian-language
  'https://wir.fibery.io/Content~Marketing/139#Article/85',
  // rusyn-language
  'https://wir.fibery.io/Content~Marketing/139#Article/73',
  // silesian-language
  'https://wir.fibery.io/Content~Marketing/139#Article/74',
  // sorbian-languages
  'https://wir.fibery.io/Content~Marketing/139#Article/88',
  // shoe-history
  'https://wir.fibery.io/Content~Marketing/139#Article/90',
  // dali
  'https://wir.fibery.io/Content~Marketing/139#Article/89',
  // dubouka
  'https://wir.fibery.io/Content~Marketing/139#Article/86',
  // kafka
  'https://wir.fibery.io/Content~Marketing/139#Article/91',
];

const importArticles = metadataTestingUser =>
  Promise.all(
    ARTICLES.map(url =>
      fiberyImport(
        {
          body: { url },
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
  console.log(`Mongoose: update ${ARTICLES.length} articles`);
  process.exit();
};

if (require.main === module) {
  run();
}

export default importArticles;
