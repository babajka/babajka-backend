import mongoose, { Schema } from 'mongoose';
import { genSalt, hash, compare } from 'bcrypt';
import fromPairs from 'lodash/fromPairs';
import pick from 'lodash/pick';

import config from 'config';
import { joinNames } from 'utils/formatting';
import { permissionsObjectValidator, validatePassword } from 'utils/validation';

const UserSchema = new Schema({
  // For a User with a role 'author' firstName, lastName and bio map locales
  // to the values. A set of locales must be the same for all of the fields mentioned.
  // For a User with a role 'regular' firstName, lastName and bio are Strings;
  // the language of these strings is undefined.
  // TODO(uladbohdan): to implement validator to verify the set of locales is the same
  // for all the fields.
  firstName: {
    type: Schema.Types.Mixed,
    required: true,
  },
  lastName: Schema.Types.Mixed,
  email: {
    type: String,
    unique: true,
    required: true,
  },
  passwordHash: String,
  permissions: {
    type: Schema.Types.Mixed,
    default: {},
    validate: permissionsObjectValidator,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  bio: Schema.Types.Mixed,
  role: {
    type: String,
    enum: ['author', 'regular'],
    required: true,
    default: 'regular',
  },
  imageUrl: String,
});

UserSchema.virtual('displayName').get(function get() {
  if (this.role === 'author') {
    return fromPairs(
      Object.entries(this.firstName).map(([l, firstName]) => [
        l,
        joinNames(firstName, this.lastName && this.lastName[l]),
      ])
    );
  }
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
  const obj = pick(object, [...basicFields, 'permissions']);
  if (!obj.permissions) {
    obj.permissions = {};
  }
  return obj;
};

export const serializeAuthor = object => pick(object, basicFields);

export const checkPermissions = (user, permissions) => {
  let list = permissions;
  if (typeof permissions === 'string') {
    list = [permissions];
  }
  return user && user.permissions && list.every(perm => user.permissions[perm]);
};

export const GENERATED_EMAIL_RGXP = /^generated-author-(\d+)@wir.by$/;

export default User;
