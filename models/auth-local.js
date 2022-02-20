import { DataTypes } from 'sequelize';

import sequelize from '../config/database.js';

const authLocal = sequelize.define('local', {
  userid: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
  },
  hash: {
    type: DataTypes.STRING,
  },
  password: {
    type: DataTypes.STRING,
  },
}, {
  schema: 'auth',
  classMethods: {
    associate(models) {
      this.belongsTo(models.User);
      this.hasMany(models.User);
    },
  },
});
