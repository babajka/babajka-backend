/* eslint-disable no-console */

// The script updates user's permissions basing on the email.
// The script executes as following:
//   npm run grant-permissions -- path-to-secret-file email role
//
// * path-to-secret-file specifies the database which is about to be modified.
//   Use '' to work with local database.
// * email of a user to be updated.
// * role is one from the constants/permissions file. Use 'user' to remove
//   all permissions.
//
// Examples of executions:
//   npm run grant-permissions -- '' admin@babajka.io author
//   npm run grant-permissions -- secret-dev.json a@b.c contentManager
//   npm run grant-permissions -- secret-prod.json a@b.c user

import connectDb from 'db';

import { User } from 'api/user';

import * as permissions from 'constants/permissions';

(async () => {
  await connectDb()
    .then(() => {
      const email = process.argv[3] || '';
      const role = process.argv[4] || '';
      if (email.length === 0 || role.length === 0 || !permissions[role]) {
        throw new Error('bad params');
      }
      return { email, role };
    })
    .then(({ email, role }) =>
      User.findOneAndUpdate(
        { email },
        { permissions: permissions[role] },
        { runValidators: true, new: true }
      ).then(u => {
        console.log('Updated user:', u);
      })
    )
    .catch(err => {
      console.log(`failed to execute: ${err}`);
    });
  process.exit();
})();
