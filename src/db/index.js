import connectDb from './db-connection';

const dropCollections = (mongoose) => {
  const collections = Object.keys(mongoose.connection.collections);

  return Promise.all(
    collections.map(
      name =>
        new Promise((resolve, reject) => {
          const collection = mongoose.connection.collections[name];

          collection.drop((err) => {
            if (err && err.message !== 'ns not found') {
              reject(err);
            }

            resolve(name);
          });
        })));
};

export { connectDb, dropCollections };
