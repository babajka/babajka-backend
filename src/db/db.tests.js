import mongoose, { Schema } from 'mongoose';
import { expect } from 'chai';

import 'db/connect';

describe('Mongoose', () => {
  try {
    const catSchema = new Schema({ name: String });
    const Cat = mongoose.model('Cat', catSchema);
    const catRawData = { name: 'Jerry' };
    const jerry = new Cat(catRawData);

    it('should save data', async () => {
      const data = await jerry.save();
      expect(data).to.equal(jerry);
    });

    it('should select correct data', async () => {
      const data = await Cat.find(catRawData);
      expect(data).to.have.lengthOf(1);
      expect(data[0].name).to.equal(jerry.name);
    });

    it('should remove collection', async () => {
      const result = await mongoose.connection.db.dropCollection('cats');
      expect(result).to.equal(true);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    it('should works without error', () => {
      expect(err).to.be.a(undefined);
    });
  }
});
