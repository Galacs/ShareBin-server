import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import db from './config/database.js';
import { } from './models/user.js';
import configPassport from './config/passport.js';
import routes from './routes/index.js';

const User = mongoose.model('User');

configPassport(passport);

const app = express();
const port = process.env.PORT || 1500;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(cookieParser());

app.use(routes);

app.get('/unprotected', (req, res) => {
  res.send('Gud');
});

app.get('/protected', passport.authenticate('jwt', { session: false, failureRedirect: '/auth/refresh' }), (req, res) => {
  User.findOne({ _id: jwt.decode(req.cookies.token).sub })
    .then((user) => {
      res.status(200).send({ success: true, username: user.auth.local.username });
    });
});

app.get('/user-protected/:userid', passport.authenticate('jwt', { session: false, failureRedirect: '/auth/refresh' }), (req, res) => {
  if (req.params.userid === jwt.decode(req.cookies.token).sub) {
    return res.send('nice');
  }
  return res.status(401).send('Unauthorized');
});

db.connection.on('connected', () => {
  if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
      console.log(`ShareBin listening at http://localhost:${port}`);
    });
  }
});
export { db };
export default app;
