/* eslint-disable no-console */

// The script updates user's permissions basing on the email.
//
// Usage:
//   npm run grant-permissions -- \
//     --secret-path='secret-file.json' \
//     --user-email='user@babajka.io' \
//     --user-role='contentManager'
//
// * role is one from the constants/permissions file. Use 'user' to remove
//   all permissions.

import { userEmail, userRole } from 'utils/args';
import connectDb from 'db';

import { User } from 'api/user';

import * as permissions from 'constants/permissions';

(async () => {
  await connectDb()
    .then(() => {
      if (userEmail.length === 0 || userRole.length === 0 || !permissions[userRole]) {
        throw new Error('bad params');
      }
    })
    .then(() =>
      User.findOneAndUpdate(
        { email: userEmail },
        { permissions: permissions[userRole] },
        { runValidators: true, new: true }
      )
        .then(u => {
          if (!u) {
            throw new Error('No user with such email');
          }
          return u;
        })
        .then(u => {
          console.log('Updated user:', u);
        })
    )
    .catch(err => {
      console.error(`Failed to execute: ${err}`);
    });
  process.exit();
})();
