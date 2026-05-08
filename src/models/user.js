const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 1,
      maxLength: 50,
      trim: true,
    },
    lastName: {
      type: String,
      minLength: 1,
      maxLength: 50,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      minLength: 5,
      maxLength: 40,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email address is not valid: " + value);
        }
      },
    },
    password: {
      type: String,
      required: true,
      minLength: 8,
      maxLength: 100,
      trim: true,
      validate(value) {
        if (!validator.isStrongPassword(value)) {
          throw new Error("Password is not strong: " + value);
        }
      },
    },
    age: {
      type: Number,
      min: 18,
      max: 130,
    },
    gender: {
      type: String,
      validate(value) {
        if (!["male", "female", "others"].includes(value)) {
          throw new Error("Gender data not valid!");
        }
      },
    },
    photoUrl: {
      type: String,
      default: "someDefaultImageUrl",
      trim: true,
      minlength: 10,
      validate(value) {
        if (!validator.isURL(value)) {
          throw new Error("URL is not valid: " + value);
        }
      },
    },
    about: {
      type: String,
      default: "Hi there! I'm using DevTinder",
      trim: true,
      minLength: 1,
      maxLength: 255,
    },
    skills: {
      type: [String],
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

module.exports = User;
