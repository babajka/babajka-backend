/* eslint-disable no-undef */

import assert from 'assert';

import * as db from '../src/db';
import config from './config';

describe('Database utils', () => {
  describe('dropCollections', () => {
    it('should drop all existing collections with mongoose models', () => {
      const connector = db.connectDb(config.mongodb.url, config.mongodb.options);
      const dummySchema = connector.mongoose.Schema();
      connector.mongoose.model('dummy', dummySchema);
      const anotherSchema = connector.mongoose.Schema();
      connector.mongoose.model('anotherDummy', anotherSchema);
      return connector.promise
        .then(() => db.dropCollections(connector.mongoose.connection))
        .then((collections) => {
          assert.equal(collections.length, 2);
          connector.mongoose.disconnect();
        });
    });
  });
});
