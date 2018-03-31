import mongoose, { Schema } from 'mongoose';
import { genSalt, hash, compare } from 'bcrypt';
import pick from 'lodash/pick';

import config from 'config';

const UserSchema = new Schema({
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
  permissions: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
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
  const postfix = this.lastName ? ` ${this.lastName}` : '';
  return `${this.firstName}${postfix}`;
});

UserSchema.virtual('password').get(function get() {
  return this.passwordHash;
});

UserSchema.methods.setPassword = async function set(password) {
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

export const serializeUser = object => pick(object, [...basicFields, 'permissions']);

export const serializeAuthor = object => pick(object, basicFields);

export const checkPermissions = (user, list) => user && list.every(perm => user.permissions[perm]);

export const GENERATED_EMAIL_RGXP = /^generated-author-(\d+)@wir.by$/;

export default User;
