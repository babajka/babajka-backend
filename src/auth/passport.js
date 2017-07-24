import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

import { User } from 'api/user';

function AuthException(message) {
  this.message = message;
}

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser((id, done) => User.findOne({ id }, (err, user) => done(err, user)));

passport.use('local-login', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true,
}, (req, email, password, done) => {
  let user;
  User.findOne({ email })
    .then((result) => {
      if (!result) {
        throw new AuthException({ email: 'Incorrect email.' });
      }

      user = result;
      return user.authenticate(password);
    })
    .then((isAuthenticated) => {
      if (!isAuthenticated) {
        throw new AuthException({ password: 'Incorrect password.' });
      }

      return done(null, user);
    })
    .catch(done);
}));


const authenticate = (strategy, req, res, next) => new Promise((resolve, reject) => {
  passport.authenticate(strategy, { failureMessage: true }, (err, user) => {
    if (err) {
      reject(err);
    }

    req.login(user, loginErr => (loginErr ? reject(loginErr) : resolve(user)));
  })(req, res, next);
});

export { AuthException, authenticate };
export default passport;
