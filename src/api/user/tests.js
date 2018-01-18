import { expect } from 'chai';

import { dropData } from 'utils/testing';

import 'db/connect';
import User from './model';

describe('User model', () => {
  const userData = { email: 'test@test.test', password: 'secret' };
  const { email, password } = userData;
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

  it('should crypt password', () => expect(user.password).to.not.equal(password));

  it('should authenticate with correct password', async () =>
    expect(await user.authenticate(password)).to.be.true);

  it('should not authenticate with wrong password', async () =>
    expect(await user.authenticate('not secret')).to.be.false);

  it('should remove user', async () => {
    await User.remove({ email });
    const result = await User.findOne({ email });
    expect(result).to.be.null; // eslint-disable-line no-unused-expressions
  });
});
