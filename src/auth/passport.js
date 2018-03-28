import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { OAuth2Strategy as GoogleStrategy } from 'passport-google-oauth';

import { User } from 'api/user';
import { ValidationError, cutSizing } from 'utils/validation';
import config from 'config';
import dictionary from 'constants/dictionary';

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser((id, done) => User.findById(id, (err, user) => done(err, user)));

passport.use(
  'local-login',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    },
    (req, email, password, done) => {
      let user;
      // Below we restrict Users with any roles other than 'regular' to login.
      // This is to prevent situations somebody tries to login as User with role 'author':
      // such users do not have a password and are not yet allowed to login.
      User.findOne({ email, role: 'regular' })
        .then(result => {
          if (!result) {
            throw new ValidationError({ email: dictionary.be.badEmail });
          }

          user = result;
          return user.authenticate(password);
        })
        .then(isAuthenticated => {
          if (!isAuthenticated) {
            throw new ValidationError({ password: dictionary.be.badPassword });
          }

          return done(null, user);
        })
        .catch(done);
    }
  )
);

passport.use(
  'local-register',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    },
    ({ body: { firstName } }, email, password, done) => {
      let user;
      User.findOne({ email })
        .then(result => {
          if (result) {
            throw new ValidationError({ email: dictionary.be.usedEmail });
          }

          user = new User({ email, firstName });
          return user.setPassword(password);
        })
        .then(() => user.save())
        .then(result => done(null, result))
        .catch(done);
    }
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: config.social.google.clientId,
      clientSecret: config.social.google.clientSecret,
      callbackURL: 'http://localhost:8080/auth/google/callback',
    },
    (accessToken, refreshToken, profile, done) => {
      const email = profile.emails[0].value;
      User.findOne({ email })
        .then(async user => {
          if (user) {
            return user;
          }
          const firstName = { unknown: profile.name && profile.name.givenName };
          const lastName = { unknown: profile.name && profile.name.familyName };
          const imageUrl = cutSizing(profile.photos && profile.photos[0].value);
          const result = await new User({ email, firstName, lastName, imageUrl }).save();
          return result;
        })
        .then(result => done(null, result))
        .catch(done);
    }
  )
);

const authenticate = (strategy, options) => (req, res, next) =>
  new Promise((resolve, reject) =>
    passport.authenticate(strategy, options, (err, user) => {
      if (err) {
        reject(err);
      }

      req.login(user, loginErr => (loginErr ? reject(loginErr) : resolve(user)));
    })(req, res, next)
  );

const local = {
  login: authenticate('local-login', { failureMessage: true }),
  register: authenticate('local-register', { failureMessage: true }),
};

const social = {
  google: {
    authenticate: passport.authenticate('google', {
      scope: [
        'https://www.googleapis.com/auth/plus.login',
        'https://www.googleapis.com/auth/plus.profile.emails.read',
      ],
    }),
    callback: passport.authenticate('google', { failureRedirect: '/auth/login' }),
  },
};

export { local, social };
export default passport;
