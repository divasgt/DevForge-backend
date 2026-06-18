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
      const isProduction = process.env.NODE_ENV === "production";
      res.cookie("token", token, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
      });
      res.send(user);
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
    const savedUser = await user1.save();

    const token = await savedUser.getJWT();
    // Add token to cookie and send to user, set expiry date
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    res.json({ message: "User created successfully!", data: savedUser });
  } catch (err) {
    res.status(400).send("Error creating the user: " + err.message);
  }
});

// Logout
authRouter.post("/logout", (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });
  res.send("Logout successful!");
});

module.exports = authRouter;
