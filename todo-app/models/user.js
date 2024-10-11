/* eslint-disable no-unused-vars */
"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.hasMany(models.Todo, {
        foreignKey: "userId",
      });
      // define association here
    }
  }

  User.init(
    {
      firstName: {
        type: DataTypes.STRING,
        allowNull: false, // Cannot be null
        validate: {
          notNull: { msg: "First name is required" }, // Custom error message
          notEmpty: { msg: "First name cannot be empty" }, // Cannot be an empty string
        },
      },

      lastName: DataTypes.STRING,

      email: {
        type: DataTypes.STRING,
        allowNull: false, // Cannot be null
        unique: true, // Ensure email is unique
        validate: {
          notNull: { msg: "Email is required" }, // Custom error message
          isEmail: { msg: "Please provide a valid email address" }, // Must be a valid email
        },
      },

      password: {
        type: DataTypes.STRING,
        allowNull: false, // Ensure the user provides a password
        validate: {
          notNull: { msg: "Password is required" },
        },  
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
