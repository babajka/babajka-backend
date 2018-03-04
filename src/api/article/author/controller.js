import pick from 'lodash/pick';

import { sendJson } from 'utils/api';

import User, { serializeAuthor, GENERATED_EMAIL_RGXP } from 'api/user/model';

export const getAll = (req, res, next) =>
  User.find({ active: true, role: 'author' })
    .then(users => users.map(serializeAuthor))
    .then(sendJson(res))
    .catch(next);

export const create = async ({ body }, res, next) => {
  let nextNum = 0;
  await User.find({ email: { $regex: GENERATED_EMAIL_RGXP } }).then(authors => {
    if (authors.length > 0) {
      nextNum =
        authors
          .map(({ email }) => parseInt(GENERATED_EMAIL_RGXP.exec(email)[1], 10))
          .sort((a, b) => a - b)
          .pop() + 1;
    }
  });

  const authorBody = {
    ...pick(body, ['firstName', 'lastName', 'bio']),
    email: `generated-author-${nextNum}@wir.by`,
    role: 'author',
  };

  return User(authorBody)
    .save()
    .then(serializeAuthor)
    .then(sendJson(res))
    .catch(next);
};