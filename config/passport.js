import passportJwt from 'passport-jwt';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const User = mongoose.model('User');

const JwtStrategy = passportJwt.Strategy;

const pathToKey = path.join('id_rsa_pub.pem');
const PUB_KEY = fs.readFileSync(pathToKey, 'utf8');

function fromCookieAsToken() {
  return (req) => {
    let token = null;
    if (req.cookies.token) {
      token = req.cookies.token;
    }
    return token;
  };
}

const options = {
  jwtFromRequest: fromCookieAsToken(),
  secretOrKey: PUB_KEY,
  algorithms: ['RS256'],
};

export default function configPassport(passport) {
  passport.use(
    new JwtStrategy(options, (jwtPayload, done) => {
      // We will assign the `sub` property on the JWT to the database ID of user
      User.findOne({ _id: jwtPayload.sub }, (err, user) => {
        if (err) {
          return done(err, false);
        }
        if (user) {
          return done(null, user);
        }
        return done(null, false);
      });
    }),
  );
}
