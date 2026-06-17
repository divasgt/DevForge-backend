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
      default: "Hi there! I'm using DevForge",
      trim: true,
      minLength: 1,
      maxLength: 1000,
    },
    skills: {
      type: [String],
      validate: [
        {
          validator: function (v) {
            return !v || v.length <= 20;
          },
          message: "You can have at most 20 skills.",
        },
      ],
    },
    socialLinks: {
      type: [
        {
          title: {
            type: String,
            trim: true,
            minLength: 1,
            maxLength: 50,
          },
          url: {
            type: String,
            trim: true,
            minlength: 10,
            maxlength: 500,
            validate(value) {
              if (!validator.isURL(value)) {
                throw new Error("URL is not valid: " + value);
              }
            },
          },
        },
      ],
      validate: [
        {
          validator: function (v) {
            return !v || v.length <= 5;
          },
          message: "You can have at most 5 social links.",
        },
      ],
    },
    specialization: {
      type: String,
      trim: true,
      minLength: 1,
      maxLength: 100,
    },
    experience: {
      type: Number,
      min: 0,
      max: 60,
    },
    city: {
      type: String,
      trim: true,
      minLength: 1,
      maxLength: 100,
    },
    country: {
      type: String,
      trim: true,
      minLength: 1,
      maxLength: 100,
    },
    lookingFor: {
      type: String,
      trim: true,
      minLength: 1,
      maxLength: 1000,
    },
    company: {
      type: String,
      trim: true,
      minLength: 1,
      maxLength: 100,
    },
    contactEmail: {
      type: String,
      trim: true,
      minLength: 5,
      maxLength: 100,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email address is not valid: " + value);
        }
      },
    },
  },
  { timestamps: true },
);

// Function to validate password
userSchema.methods.getJWT = async function () {
  const token = await jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
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
