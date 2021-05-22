import mongoose from 'mongoose';
import express from 'express';

import { issueJWT, genPassword, validPassword } from '../../lib/utils.js';

const router = express.Router();
const User = mongoose.model('User');

// Validate an existing user and issue a JWT
router.post('/login', (req, res, next) => {
  User.findOne({ username: req.body.username })
    .then((user) => {
      if (!user) {
        return res.status(401).json({ success: false, msg: 'could not find user' });
      }
      // Function defined at bottom of app.js

      const isValid = validPassword(req.body.password, user.hash, user.salt);
      if (isValid) {
        const tokenObject = issueJWT(user);

        res.status(200)
          .json({ success: true, token: tokenObject.token, expiresIn: tokenObject.expires });
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
  User.findOne({ username: req.body.username })
    .then((username) => {
      if (!username) {
        const saltHash = genPassword(req.body.password);

        const { salt } = saltHash;
        const { hash } = saltHash;

        const newUser = new User({
          username: req.body.username,
          hash,
          salt,
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

export default router;
