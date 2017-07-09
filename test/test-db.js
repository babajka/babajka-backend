import assert from 'assert';

import * as db from '../src/db';
import config from './config';

describe("Database utils", function () {
	describe("dropCollections", function () {
		it('should drop all existing collections with mongoose models', function () {
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
				}).catch((err) => connector.mongoose.disconnect());
		})
	});
});