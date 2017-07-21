import { expect } from 'chai';

import 'db/connect';
import User from './model';

describe('User', () => {
  try {
    const userData = { id: 100000000000000, email: 'test@test.test', password: 'secret' };
    const { id, email, password } = userData;
    const user = new User(userData);

    it('should save user with password', async () => {
      // await connectDb();
      await user.setPassword(password);
      const result = await user.save();
      expect(result.id).to.equal(id);
      expect(result.email).to.equal(email);
      expect(result.password).to.not.equal(undefined);
    });

    it('should select user byId', async () => {
      const result = await User.findOne({ id });
      expect(result.id).to.equal(id);
      expect(result.email).to.equal(email);
      expect(result.password).to.equal(user.password);
    });

    it('should crypt password', () => expect(user.password).to.not.equal(password));

    it('should authenticate with correct password',
      async () => expect(await user.authenticate(password)).to.be.true,
    );

    it('should not authenticate with wrong password',
      async () => expect(await user.authenticate('not secret')).to.be.false,
    );

    it('should remove user', async () => {
      await User.remove({ id });
      const result = await User.findOne({ id });
      expect(result).to.be.null; // eslint-disable-line no-unused-expressions
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    it('should works without error', () => {
      expect(err).to.be.a(undefined);
    });
  }
});
