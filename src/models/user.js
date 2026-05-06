const mongoose = require("mongoose");

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
    },
    password: {
      type: String,
      required: true,
      minLength: 8,
      maxLength: 100,
      trim: true,
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
