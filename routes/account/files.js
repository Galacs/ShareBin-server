import mongoose from 'mongoose';
import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = express.Router();
const User = mongoose.model('User');

router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const files = await User.findOne({ _id: jwt.decode(req.cookies.token).sub }, { objects: 1 });
    // console.log(files);
    res.status(200).json(files.objects);
  } catch (e) {
    res.json({ success: false, msg: e });
  }
});

export default router;
