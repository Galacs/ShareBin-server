import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  auth: {
    local: {
      username: String,
      hash: String,
      salt: String,
    },
  },
});

mongoose.model('User', UserSchema);
