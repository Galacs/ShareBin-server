import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  auth: {
    local: {
      username: String,
      hash: String,
      salt: String,
    },
  },
  objects: {
    id: String,
    filename: String,
    date: String,
  },
});

mongoose.model('User', UserSchema);
