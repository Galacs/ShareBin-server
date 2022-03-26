// import { DataTypes } from 'sequelize';

// import sequelize from '../config/database.js';

// const User = sequelize.define('user', {
//   userid: {
//     type: DataTypes.STRING,
//     primaryKey: true,
//   },
// });

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
    uploadDate: Date,
    expirationDate: Date,
  },
});

mongoose.model('User', UserSchema);