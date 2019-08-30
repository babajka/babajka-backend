import mongoose from 'mongoose';
import { genSalt, hash, compare } from 'bcrypt';
import pick from 'lodash/pick';

import config from 'config';
import Joi, { joiToMongoose } from 'utils/joi';
import { joinNames } from 'utils/formatting';
import { validatePassword } from 'utils/validation';

const joiUserSchema = Joi.object({
  // IMPORTANT:
  // User model has not changed much with the introduction of Authors-as-Tags.
  // We now do not support Users with role 'author' but we do not remove 'role'
  // either. The code below might contain some legacy concepts and ideas.
  //
  // For a User with a role 'author' firstName, lastName and bio map locales
  // to the values. A set of locales must be the same for all of the fields mentioned.
  // For a User with a role 'regular' firstName, lastName and bio are Strings;
  // the language of these strings is undefined.
  firstName: Joi.localizedText().required(),
  lastName: Joi.localizedText(),
  bio: Joi.localizedText(),
  email: Joi.string()
    .required()
    .meta({ unique: true }),
  passwordHash: Joi.string(),
  permissions: Joi.userPermissions().required(),
  createdAt: Joi.date()
    .default(Date.now, 'time of creation')
    .required(),
  active: Joi.boolean().default(true),
  role: Joi.string()
    .valid([
      // 'author',
      'regular',
    ])
    .required()
    .default('regular'),
  imageUrl: Joi.image(),
});

const UserSchema = joiToMongoose(joiUserSchema);

UserSchema.virtual('displayName').get(function get() {
  // if (this.role === 'author') {
  //   return fromPairs(
  //     Object.entries(this.firstName).map(([l, firstName]) => [
  //       l,
  //       joinNames(firstName, this.lastName && this.lastName[l]),
  //     ])
  //   );
  // }

  // The role is 'regular' (default).
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

const basicFields = [
  'firstName',
  'lastName',
  'displayName',
  'email',
  'role',
  'active',
  'bio',
  'imageUrl',
];

export const serializeUser = object => {
  if (!object) {
    return null;
  }
  const obj = pick(object, [...basicFields, 'permissions']);
  if (!obj.permissions) {
    obj.permissions = {};
  }
  return obj;
};

export const getUserResponse = object => ({ user: serializeUser(object) });

export const serializeAuthor = object => pick(object, basicFields);

export const checkPermissions = (user, permissions) => {
  let list = permissions;
  if (typeof permissions === 'string') {
    list = [permissions];
  }
  return user && user.permissions && list.every(perm => user.permissions[perm]);
};

export default User;
