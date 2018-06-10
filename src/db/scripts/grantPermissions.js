/* eslint-disable no-console */

// Should be called with two options: email, role.
// Role is one from constants/permissions.

import connectDb from 'db';

import { User } from 'api/user';

import * as permissions from 'constants/permissions';

(async () => {
  await connectDb()
    .then(() => {
      const email = process.argv[2] || '';
      const role = process.argv[3] || '';
      if (email.length === 0 || role.length === 0 || !permissions[role]) {
        throw new Error('bad params');
      }
      return { email, role };
    })
    .then(({ email, role }) =>
      User.findOneAndUpdate({ email }, { permissions: permissions[role] }, { new: true }).then(
        u => {
          console.log('Updated user:', u);
        }
      )
    )
    .catch(err => {
      console.log(`failed to execute: ${err}`);
    });
  process.exit();
})();
