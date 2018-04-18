import mongoose from 'mongoose';
import supertest from 'supertest';
import { expect } from 'chai';
import pick from 'lodash/pick';

import app from 'server';

import User from 'api/user/model';

// The file is excluded from the build and must only contain utils used by testing.

export const dropData = () => mongoose.connection.db.dropDatabase();

const request = supertest.agent(app.listen());

const defaultAdminData = {
  firstName: 'Name',
  email: 'admin@babajka.io',
  password: 'password',
  permissions: { canCreateArticle: true, canManageArticles: true },
};

const createAdmin = async () => {
  const user = new User(defaultAdminData);
  await user.setPassword(defaultAdminData.password);
  await user.save();
};

const login = () =>
  request
    .post('/auth/login')
    .send(pick(defaultAdminData, ['email', 'password']))
    .expect(200)
    .then(res => {
      // eslint-disable-next-line no-unused-expressions
      expect(res.headers['set-cookie']).not.empty;
      return res.headers['set-cookie'];
    });

export const loginDefaultAdmin = async () => {
  await createAdmin();
  return login(defaultAdminData);
};
