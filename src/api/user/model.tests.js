import 'db/connect';

import { expect, dropData } from 'utils/testing';

import User from './model';

describe('User model', () => {
  const userData = { firstName: 'Name', email: 'test@babajka.io', password: 'longsecret' };
  const { firstName, email, password } = userData;
  const user = new User(userData);

  before(dropData);

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
    expect(await user.authenticate(password)).to.be.true());

  it('should not authenticate with wrong password', async () =>
    expect(await user.authenticate('not secret')).to.be.false());

  it('should remove user', async () => {
    await User.remove({ email });
    const result = await User.findOne({ email });
    expect(result).to.be.null();
  });
});
