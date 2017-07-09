import mongoose, { Schema } from 'mongoose';
import assert from 'assert';

import connectDb from './index';

describe('Database tests', () => {
  it('should be connect without error', () => connectDb().catch(err => assert.equal(err, undefined)));
  const catSchema = new Schema({ name: String });
  const Cat = mongoose.model('Cat', catSchema);
  const catRawData = { name: 'Jerry' };
  const jerry = new Cat(catRawData);
  it('should be save data', () => jerry.save().then(data => assert.equal(data, jerry)));
  it('should be select correct data', () => Cat.find(catRawData)
    .then((data) => {
      assert.equal(data.length, 1);
      assert.equal(data[0].name, jerry.name);
    }));
  it('should be remove collection', () => mongoose.connection.db.dropCollection('cats')
    .then(result => assert.equal(result, true)));
});
