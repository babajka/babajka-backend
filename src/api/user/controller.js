/* eslint-disable no-unused-vars */

import { sendJson } from 'utils/api';
import { serializeUser } from './model';

export const getAll = (req, res, next) => res.status(200).json({ message: 'users getAll api' });

export const getCurrent = ({ user }, res, next) => sendJson(res)(serializeUser(user));
