import mongoose from 'mongoose';
import express from 'express';

import { issueJWT, genPassword, validPassword } from '../../lib/utils.js';

const router = express.Router();
const User = mongoose.model('User');

// Validate an existing user and issue a JWT
router.post('/login', (req, res, next) => {
  User.findOne({ 'auth.local.username': req.body.username }, { 'auth.local': 1 })
    .then((user) => {
      if (!user) {
        return res.status(401).json({ success: false, msg: 'could not find user' });
      }

      const isValid = validPassword(req.body.password, user.auth.local.hash, user.auth.local.salt);
      if (isValid) {
        const tokenObject = issueJWT(user);

        // Create new Date instance
        const date = new Date();
        // Add a day
        date.setDate(date.getDate() + 1);

        res.cookie('token', tokenObject.token, {
          expires: date,
          secure: false,
          httpOnly: true,
        });
        res.status(200).json({ success: true });
      } else {
        res.status(401).json({ success: false, msg: 'you have entered the wrong password' });
      }
    })
    .catch((err) => {
      next(err);
    });
});

// Register a new user
router.post('/register', (req, res) => {
  // Check if user already exists
  User.findOne({ 'auth.local.username': req.body.username }, {})
    .then((username) => {
      if (!username) {
        const saltHash = genPassword(req.body.password);

        const { salt } = saltHash;
        const { hash } = saltHash;

        const newUser = new User({
          auth: {
            local: {
              username: req.body.username,
              hash,
              salt,
            },
          },
        });

        try {
          newUser.save()
            .then(() => {
              res.json({ success: true });
            });
        } catch (err) {
          res.json({ success: false, msg: err });
        }
      } else {
        res.status(409).json({ success: false, msg: 'User already exists' });
      }
    });
});

export default router;
