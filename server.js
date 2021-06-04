import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import passport from 'passport';

import db from './config/database.js';
import { } from './models/user.js';
import configPassport from './config/passport.js';
import routes from './routes/index.js';

configPassport(passport);

const app = express();
const port = process.env.PORT || 1500;

app.use(express.json());
app.use(cors());
app.use(cookieParser());

app.use(routes);

app.get('/unprotected', (req, res) => {
  res.send('Gud');
});

app.get('/protected', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.send('nice');
});

db.connection.on('connected', () => {
  app.listen(port, () => {
    console.log(`ShareBin listening at http://localhost:${port}`);
  });
});
export { db };
export default app;
