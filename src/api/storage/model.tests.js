import 'db/connect';

import { expect, dropData, spy, defaultObjectMetadata, addAdminUser } from 'utils/testing';

import { StorageEntity } from './model';

describe('StorageEntity model', () => {
  let data;

  before(async function() {
    this.timeout(5000);

    await dropData();
    StorageEntity.ensureIndexes();

    await addAdminUser();
    const metadata = await defaultObjectMetadata();
    data = {
      key: 'doc-key',
      document: { kek: 'lol' },
      metadata,
    };
  });

  it('should fail to save doc | dup key', async () => {
    const errorHandler = spy(({ message }) => {
      expect(message).to.not.empty();
      expect(message).to.include('duplicate key');
    });

    await StorageEntity(data).save();
    await StorageEntity(data)
      .save()
      .catch(errorHandler);

    expect(errorHandler).to.have.been.called();
    await StorageEntity.find({}).then(docs => expect(docs).to.have.length(1));
  });
});
