import mongoose from 'mongoose';
import { genSalt, hash, compare } from 'bcrypt';
import castArray from 'lodash/castArray';
import pick from 'lodash/pick';

import config from 'config';
import Joi, { joiToMongoose } from 'utils/joi';
import { joinNames } from 'utils/formatting';
import { validatePassword } from 'utils/validation';

const joiUserSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string(),
  email: Joi.string()
    .required()
    .meta({ unique: true }),
  passwordHash: Joi.string(),
  permissions: Joi.userPermissions().default({}),
  createdAt: Joi.date()
    .default(Date.now, 'time of creation')
    .required(),
  active: Joi.boolean().default(true),
});

const UserSchema = joiToMongoose(joiUserSchema);

UserSchema.virtual('displayName').get(function get() {
  return joinNames(this.firstName, this.lastName);
});

UserSchema.virtual('password').get(function get() {
  return this.passwordHash;
});

UserSchema.set('toObject', { virtuals: true });
UserSchema.set('toJSON', { virtuals: true });

UserSchema.methods.setPassword = async function set(password) {
  validatePassword(password);
  this.passwordHash = await this.generateHash(password);
};

UserSchema.methods.generateHash = async password => {
  const salt = await genSalt(config.auth.saltRounds);
  return hash(password, salt);
};

UserSchema.methods.authenticate = async function authenticate(password) {
  return compare(password, this.passwordHash);
};

const User = mongoose.model('User', UserSchema);

const basicFields = ['firstName', 'lastName', 'displayName', 'email', 'active', 'permissions'];

export const serializeUser = object => {
  if (!object) {
    return null;
  }
  const obj = pick(object, basicFields);
  // TODO: remove?
  if (!obj.permissions) {
    obj.permissions = {};
  }
  return obj;
};

export const getUserResponse = object => ({ user: serializeUser(object) });

export const checkPermissions = (user, permissions) => {
  const list = castArray(permissions);
  return user && user.permissions && list.every(perm => user.permissions[perm]);
};

export default User;
