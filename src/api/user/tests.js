import { expect, dropData } from 'utils/testing';

import 'db/connect';
import User from './model';

describe('User model', () => {
  const userData = { firstName: 'Name', email: 'test@test.test', password: 'longsecret' };
  const { firstName, email, password } = userData;
  const user = new User(userData);

  after(dropData);

  it('should save user with password', async () => {
    await user.setPassword(password);
    const result = await user.save();
    expect(result.email).to.equal(email);
    expect(result.password).to.not.equal(undefined);
  });

  it('should select user by email', async () => {
    const result = await User.findOne({ email });
    expect(result.email).to.equal(email);
    expect(result.password).to.equal(user.password);
  });

  it('should only return firstName as displayName', async () => {
    const result = await User.findOne({ email });
    expect(result.displayName).to.equal(firstName);
  });

  it('should return firstName and lastName as displayName', async () => {
    const lastName = 'LastName';
    const result = await User.findOneAndUpdate({ email }, { lastName }, { new: true }).exec();
    expect(result.displayName).to.equal(`${firstName} ${lastName}`);
  });

  it('should crypt password', () => expect(user.password).to.not.equal(password));

  it('should authenticate with correct password', async () =>
    expect(await user.authenticate(password)).to.be.true);

  it('should not authenticate with wrong password', async () =>
    expect(await user.authenticate('not secret')).to.be.false);

  it('should remove user', async () => {
    await User.remove({ email });
    const result = await User.findOne({ email });
    expect(result).to.be.null();
  });
});

describe('User model as Author', () => {
  const authorData = {
    firstName: { be: 'FirstName-be', en: 'FirstName-en' },
    email: 'generated-author@wir.by',
    role: 'author',
  };

  const { firstName, email } = authorData;
  const author = new User(authorData);

  after(dropData);

  it('should save author', async () => {
    const result = await author.save();
    expect(result.email).to.equal(email);
  });

  it('should return proper displayName', async () => {
    const result = await User.findOne({ email });
    expect(Object.keys(result.displayName)).has.length(Object.keys(firstName).length);
    expect(result.displayName.be).to.equal(firstName.be);
    expect(result.displayName.en).to.equal(firstName.en);
  });

  it('should join displayName with lastName', async () => {
    const lastName = { be: 'LastName-be', en: 'LastName-en' };
    const result = await User.findOneAndUpdate({ email }, { lastName }, { new: true }).exec();
    expect(Object.keys(result.displayName)).has.length(Object.keys(firstName).length);
    expect(result.displayName.be).to.equal(`${firstName.be} ${lastName.be}`);
    expect(result.displayName.en).to.equal(`${firstName.en} ${lastName.en}`);
  });
});
