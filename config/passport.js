import passportJwt from 'passport-jwt';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const User = mongoose.model('User');

const { ExtractJwt } = passportJwt;
const JwtStrategy = passportJwt.Strategy;

// const pathToKey = path.join(__dirname, '..', 'id_rsa_pub.pem');
const pathToKey = path.join('id_rsa_pub.pem');
const PUB_KEY = fs.readFileSync(pathToKey, 'utf8');

// At a minimum, you must pass the `jwtFromRequest` and `secretOrKey` properties
const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: PUB_KEY,
  algorithms: ['RS256'],
};

export default function configPassport(passport) {
  passport.use(
    new JwtStrategy(options, (jwtPayload, done) => {
      console.log(jwtPayload);

      // We will assign the `sub` property on the JWT to the database ID of user
      User.findOne({ _id: jwtPayload.sub }, (err, user) => {
        // This flow look familiar?  It is the same as when we implemented
        // the `passport-local` strategy
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

// // app.js will pass the global passport object here, and this function will configure it
// module.exports = (passport) => {
//   // The JWT payload is passed into the verify callback
// };
