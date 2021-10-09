import mongoose from 'mongoose';
import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

import { validPassword } from '../../lib/utils.js';

const router = express.Router();
const User = mongoose.model('User');

// Delete a user
router.delete('/', passport.authenticate('jwt', { session: false, failureRedirect: '/auth/refresh' }), (req, res) => {
  // Check if the user exists
  User.findOne({ _id: jwt.decode(req.cookies.token).sub }, {})
    .then((user) => {
      if (user && validPassword(req.body.password, user.auth.local.hash, user.auth.local.salt)) {
        User.deleteOne(user, (err) => {
          if (err) {
            res.status(409).json({ success: false, msg: 'Error' });
          } else {
            res.status(200).json({ success: true, msg: 'User succesfully deleted' });
          }
        });
      } else {
        res.status(409).json({ success: false, msg: 'Unauthorized' });
      }
    });
});

export default router;
