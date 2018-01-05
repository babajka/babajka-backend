/* eslint-disable no-unused-vars */

import { sendJson } from 'utils/api';
import User, { serializeUser } from './model';

export const getAll = async (req, res, next) =>
  User.find({})
    .select('-_id -__v')
    .then(sendJson(res))
    .catch(next);

export const getCurrent = ({ user }, res, next) => sendJson(res)(serializeUser(user));
