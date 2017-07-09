import connectDb from './db-connection';

const dropCollections = (db) => {
  const collections = Object.keys(db.collections);

  return Promise.all(
    collections.map(
      name =>
        new Promise((resolve, reject) => {
          const collection = db.collections[name];

          collection.drop((err) => {
            if (err && err.message !== 'ns not found') {
              reject(err);
            }

            resolve(name);
          });
        })));
};

export { connectDb, dropCollections };
