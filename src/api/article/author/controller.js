import pick from 'lodash/pick';

import { sendJson } from 'utils/api';

import User, { serializeUser } from 'api/user/model';

export const getAll = (req, res, next) =>
  User.find({ role: 'author' })
    .then(users => users.map(serializeUser))
    .then(sendJson(res))
    .catch(next);

export const create = ({ body }, res, next) => {
  const authorBody = {
    ...pick(body, ['firstName', 'lastName', 'bio']),
    // TODO(uladbohdan): to guarantee email uniqueness here.
    email: `${body.firstName}-${body.lastName}-author@wir.by'`,
    role: 'author',
  };

  return User(authorBody)
    .save()
    .then(sendJson(res))
    .catch(next);
};
