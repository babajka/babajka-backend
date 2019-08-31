import 'db/connect';

import { expect, dropData, addAdminUser } from 'utils/testing';

import { StorageEntity } from './model';

describe('Storage Helpers', () => {
  let userId;

  before(async () => {
    await dropData();

    const user = await addAdminUser();
    userId = user._id;
    await StorageEntity.setValue('key', { some: 'value' }, userId);
  });

  it('should retrieve a value from the storage', () =>
    StorageEntity.getValue('key').then(({ document }) => {
      expect(document).not.empty();
      expect(document.some).to.equal('value');
    }));

  it('should update storage entity on set', () =>
    StorageEntity.setValue('key', { some: 'old', also: 'new' }, userId).then(({ document }) => {
      expect(document).not.empty();
      expect(document.some).to.equal('old');
      expect(document.also).to.equal('new');
    }));

  it('should retrieve an updates value from storage', () =>
    StorageEntity.getValue('key').then(({ document }) => {
      expect(document).not.empty();
      expect(document.also).to.equal('new');
    }));
});
