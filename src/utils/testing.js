/*
    The file is excluded from the build and must only contain utils used by testing.
 */
/* eslint-disable import/no-extraneous-dependencies */

import mongoose from 'mongoose';
import supertest from 'supertest';
import chai from 'chai';
import dirtyChai from 'dirty-chai';

import app from 'server';
import User from 'api/user/model';
import * as permissions from 'constants/permissions';

const { expect } = chai;
chai.use(dirtyChai);

export const dropData = () => mongoose.connection.db.dropDatabase();

const request = supertest.agent(app.listen());

export const testData = {
  admin: {
    firstName: 'Name',
    email: 'admin@babajka.io',
    password: 'password',
    permissions: permissions.admin,
  },
  author: {
    firstName: 'Name',
    email: 'author@babajka.io',
    password: 'password',
    permissions: permissions.author,
    role: 'author',
  },
};

export const addUser = async data => {
  const user = new User(data);
  await user.setPassword(data.password);
  await user.save();
};

export const testLogin = ({ email, password }) =>
  request
    .post('/auth/login')
    .send({ email, password })
    .expect(200)
    .then(res => {
      expect(res.headers['set-cookie']).not.empty();
      return res.headers['set-cookie'];
    });

export const loginTestAdmin = async () => {
  await addUser(testData.admin);
  return testLogin(testData.admin);
};

export { expect, supertest };
