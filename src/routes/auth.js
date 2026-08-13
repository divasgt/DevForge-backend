const express = require("express");
const User = require("../models/user");
const { validateSignUpData } = require("../utils/validation");
const bcrypt = require("bcrypt");
const axios = require("axios");

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

// GitHub Login
authRouter.post("/github", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      throw new Error("Missing GitHub authorization code.");
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }, {
      headers: {
        accept: 'application/json'
      }
    });

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      throw new Error("Failed to get GitHub access token");
    }

    // Get user profile
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'DevForge',
      }
    });

    const githubUser = userResponse.data;
    
    // Get user email
    const emailResponse = await axios.get('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'DevForge',
      }
    });
    
    const primaryEmailObj = emailResponse.data.find(e => e.primary) || emailResponse.data[0];
    const email = primaryEmailObj ? primaryEmailObj.email : null;

    if (!email) {
      throw new Error("No email found in GitHub account.");
    }

    let user = await User.findOne({ email });
    let isNewUser = false;
    
    if (!user) {
      isNewUser = true;
      const nameParts = (githubUser.name || githubUser.login).split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || undefined;
      
      user = new User({
        firstName,
        lastName,
        email,
        photoUrl: githubUser.avatar_url || "https://geographyandyou.com/images/user-profile.png",
        authProvider: "github",
        providerId: githubUser.id.toString(),
      });
      await user.save();
    } else if (!user.providerId) {
      user.authProvider = "github";
      user.providerId = githubUser.id.toString();
      await user.save();
    }

    const token = await user.getJWT();
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });
    const userResponseData = user.toJSON();
    userResponseData.isNewUser = isNewUser;
    
    res.send(userResponseData);
  } catch (err) {
    const githubMessage = err.response?.data?.message;
    const status = err.response?.status || 400;
    res.status(status).send("GitHub Auth Error: " + (githubMessage || err.message));
  }
});

module.exports = authRouter;
