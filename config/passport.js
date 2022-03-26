import passportJwt from 'passport-jwt';
import fs from 'fs';
import path from 'path';

import pool from './database.js';

const JwtStrategy = passportJwt.Strategy;

const pathToKey = path.join(path.resolve(), 'keys', 'id_rsa_pub.pem');
const PUB_KEY = fs.readFileSync(pathToKey, 'utf8');

const options = {
  jwtFromRequest: (req) => req.cookies.token || null,
  secretOrKey: PUB_KEY,
  algorithms: ['RS256'],
};

export default function configPassport(passport) {
  passport.use(
    new JwtStrategy(options, (jwtPayload, done) => {
      // We will assign the `sub` property on the JWT to the database ID of user
      console.log('hit');
      done(null, true);
      // try {
      //   const data = pool.query('SELECT * FROM auth.local WHERE userid = $1', [jwtPayload.sub]);
      //   return done(null, false);
      // } catch (e) {
      //   return done(e, false);
      // }
    }),
  );
}
