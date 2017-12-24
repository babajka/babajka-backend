import mongoose, { Schema } from 'mongoose';
import { genSalt, hash, compare } from 'bcrypt';

import config from 'config';

const UserSchema = new Schema({
  firstName: String,
  lastName: String,
  email: {
    type: String,
    unique: true,
    required: true,
  },
  passwordHash: String,
  role: {
    type: String,
    required: true,
    enum: ['admin', 'user', 'creator'],
    default: 'user',
  },
  createdAt: { type: Date, default: Date.now },
  active: {
    type: Boolean,
    default: true,
  },
  bio: String,
});

UserSchema.virtual('name').get(function get() {
  return `${this.firstName} ${this.lastName}`;
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

export const serializeUser = ({ firstName, lastName, email, role }) => ({
  firstName,
  lastName,
  email,
  role,
});

export const checkRoles = (user, roles) => user && roles.includes(user.role);

export default User;
