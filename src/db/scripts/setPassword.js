/* eslint-disable no-console */

// The script resets password for the user specified.
// This cannot currently be done by any other means.
//
// Usage:
//  npm run set-password -- \
//    --secretPath='secret-file.json' \
//    --userEmail='admin@babajka.io' \
//    --newPassword='newPassword'
//
// Be sure to choose the password which satisfies validation conditions;
// otherwise the script will fail.

import { userEmail, newPassword } from 'utils/args';
import connectDb from 'db';

import { User } from 'api/user';

(async () => {
  await connectDb()
    .then(() => {
      if (userEmail.length === 0 || newPassword.length === 0) {
        throw new Error('bad params');
      }
    })
    .then(async () => {
      const user = await User.findOne({ email: userEmail }).exec();
      await user.setPassword(newPassword);
      await user.save();
      console.log(`successfully updated password of user ${userEmail}`);
    })
    .catch(err => {
      console.log(`failed to execute:`, err.message);
    });
  process.exit();
})();
