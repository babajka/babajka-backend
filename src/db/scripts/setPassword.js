/* eslint-disable no-console */

// The script resets password for the user specified.
// This cannot currently be done by other means.
//
// Usage:
//  npm run set-password -- 'secret-file.json' email newPassword
//
// Example:
//  npm run set-password -- '' admin@babajka.io password
// (this changes password to 'password' for admin@babajka.io user in local DB)
//
// Be sure to choose the password which satisfies validation conditions;
// otherwise the script will fail.

import connectDb from 'db';

import { User } from 'api/user';

(async () => {
  await connectDb()
    .then(() => {
      const email = process.argv[3] || '';
      const newPassword = process.argv[4] || '';
      if (email.length === 0 || newPassword.length === 0) {
        throw new Error('bad params');
      }
      return { email, newPassword };
    })
    .then(async ({ email, newPassword }) => {
      const user = await User.findOne({ email }).exec();
      await user.setPassword(newPassword);
      await user.save();
      console.log(`successfully updated password of user ${email}`);
    })
    .catch(err => {
      console.log(`failed to execute:`, err.message);
    });
  process.exit();
})();
