const express = require("express");
const User = require("../models/user");
const { validateSignUpData } = require("../utils/validation");
const bcrypt = require("bcrypt");

const authRouter = express.Router();

// Login
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    // find user from DB
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Invalid email id or password.");
    }

    const isPasswordValid = await user.validatePassword(password);
    if (isPasswordValid) {
      const token = await user.getJWT();

      // Add token to cookie and send to user, set expiry date
      res.cookie("token", token, {
        expires: new Date(Date.now() + 7 * 360000),
      });
      res.send("Login successful!");
    } else {
      throw new Error("Invalid email id or password.");
    }
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

// Create new user
authRouter.post("/signup", async (req, res) => {
  const data = req.body;
  const ALLOWED_INSERTIONS = [
    "firstName",
    "lastName",
    "email",
    "password",
    "age",
    "gender",
    "photoUrl",
    "about",
    "skills",
  ];
  const isInsertAllowed = Object.keys(data).every((k) =>
    ALLOWED_INSERTIONS.includes(k),
  );

  try {
    if (!isInsertAllowed) {
      throw new Error("Signup data not appropriate!");
    }

    // Validating data
    validateSignUpData(req);

    // Encrypting password
    const { password } = data;
    const passwordHash = await bcrypt.hash(password, 10);

    const user1 = new User({
      ...data,
      password: passwordHash,
    });
    await user1.save();
    res.send("User created successfully!");
  } catch (err) {
    res.status(400).send("Error creating the user: " + err.message);
  }
});

module.exports = authRouter;
