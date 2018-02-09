import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

import { User } from 'api/user';
import { ValidationError } from 'utils/validation';

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
            throw new ValidationError({ password: 'Няправільны емэйл ці пароль' });
          }

          user = result;
          return user.authenticate(password);
        })
        .then(isAuthenticated => {
          if (!isAuthenticated) {
            throw new ValidationError({ password: 'Няправільны емэйл ці пароль' });
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
    },
    (email, password, done) => {
      let user;
      User.findOne({ email })
        .then(result => {
          if (result) {
            throw new ValidationError({ email: 'Гэты емэйл ужо выкарыстаны' });
          }

          user = new User({ email });
          return user.setPassword(password);
        })
        .then(() => user.save())
        .then(result => done(null, result))
        .catch(done);
    }
  )
);

const authenticate = (strategy, req, res, next) =>
  new Promise((resolve, reject) => {
    passport.authenticate(strategy, { failureMessage: true }, (err, user) => {
      if (err) {
        reject(err);
      }

      req.login(user, loginErr => (loginErr ? reject(loginErr) : resolve(user)));
    })(req, res, next);
  });

export { authenticate };
export default passport;
