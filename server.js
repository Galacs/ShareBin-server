import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import passport from 'passport';
import jwt from 'jsonwebtoken';

import pool from './config/database.js';
import { } from './models/user.js';
import { } from './models/auth-local.js';
import configPassport from './config/passport.js';
import routes from './routes/index.js';
import authenticateJWT from './config/authenticateJWT.js';

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

app.get('/protected', authenticateJWT, async (req, res) => {
  const data = await pool.query('SELECT * FROM auth.local WHERE userid = $1', [jwt.decode(req.cookies.token).sub]);
  if (data.rows.length === 0) {
    return res.status(401).json({ success: false, msg: 'could not find user' });
  }
  res.status(200).send({ success: true, username: data.rows[0].username });
});

app.get('/user-protected/:userid', authenticateJWT, (req, res) => {
  if (req.params.userid === jwt.decode(req.cookies.token).sub) {
    return res.send('nice');
  }
  return res.status(401).send('Unauthorized');
});

// db.connection.on('connected', () => {
//   if (process.env.NODE_ENV !== 'test') {
//     app.listen(port, () => {
//       console.log(`ShareBin listening at http://localhost:${port}`);
//     });
//   }
// });

try {
  if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
      console.log(`ShareBin listening at http://localhost:${port}`);
    });
  }
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

// export { db };
export default app;
