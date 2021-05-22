import mongoose from 'mongoose';
import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

import { issueJWT, genPassword, validPassword } from '../../lib/utils.js';

const router = express.Router();
const User = mongoose.model('User');

// Validate an existing user and issue a JWT
router.post('/login', (req, res, next) => {
  // User.findOne({ auth: { local: { username: req.body.username } } })
  User.findOne({ 'auth.local.username': req.body.username })
    .then((user) => {
      if (!user) {
        return res.status(401).json({ success: false, msg: 'could not find user' });
      }
      // Function defined at bottom of app.js

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
  User.findOne({ 'auth.local.username': req.body.username })
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
            .then((user) => {
              res.json({ success: true, user });
            });
        } catch (err) {
          res.json({ success: false, msg: err });
        }
      } else {
        res.status(409).json({ success: false, msg: 'User already exists' });
      }
    });
});

// Delete a user (GPDR)
router.post('/delete', passport.authenticate('jwt', { session: false }), (req, res) => {
//   let token = null;
//   if (req.cookies.token) {
//     token = req.cookies.token;
//   }

  // Check if the user exists
  User.findOne({ _id: jwt.decode(req.cookies.token).sub })
    .then((user) => {
      if (user) {
        User.deleteOne(user, (err) => {
          if (err) {
            res.status(409).json({ success: false, msg: 'Error' });
          } else {
            res.status(200).json({ success: true, msg: 'User succesfully deleted' });
          }
        });
      } else {
        res.status(409).json({ success: false, msg: 'User does not exist' });
      }
    });
});

export default router;
