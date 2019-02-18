import { sendJson } from 'utils/api';
import User, { serializeUser } from './model';

export const getAll = (req, res, next) =>
  User.find({})
    .then(users => users.map(serializeUser))
    .then(sendJson(res))
    .catch(next);

// eslint-disable-next-line no-unused-vars
export const getCurrent = ({ user }, res, next) => sendJson(res)({ user: serializeUser(user) });
