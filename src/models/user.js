const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

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
      // using enum, the valid values will be restricted to these values below
      enum: {
        values: ["male", "female", "other"],
        // this error message will be shown, value is the value passed
        message: `{VALUE} is not a valid gender type.`,
      },
      // validate(value) {
      //   if (!["male", "female", "others"].includes(value)) {
      //     throw new Error("Gender data not valid!");
      //   }
      // },
    },
    photoUrl: {
      type: String,
      default: "https://someDefaultImageUrl.com",
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

// Function to validate password
userSchema.methods.getJWT = async function () {
  const token = await jwt.sign({ _id: this._id }, "DEV@Tinder$790", {
    expiresIn: "7d",
  });

  return token;
};

// Function to create a JWT token
userSchema.methods.validatePassword = async function (passwordInputByUser) {
  const passwordHash = this.password;
  const isPasswordValid = await bcrypt.compare(
    passwordInputByUser,
    passwordHash,
  );
  return isPasswordValid;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
