require("dotenv").config();
const express = require("express");
const connectDB = require("./config/database");
const User = require("./models/user");
const { validateSignUpData } = require("./utils/validation");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { userAuth } = require("./middlewares/auth");

const app = express();

// Middleware to read or accept json from requests. Without writing this, if we console.log(req.body) we will get undefined.
app.use(express.json());
// Middleware to read cookies, without writing this, if we console.log(req.cookies) we get undefined.
app.use(cookieParser());

app.get("/profile", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

app.post("/login", async (req, res) => {
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

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
      // Create a JWT token, set expiry date
      const token = await jwt.sign({ _id: user._id }, "DEV@Tinder$790", {
        expiresIn: "7d",
      });

      // Add token to cookie and send to user, set expiry date
      res.cookie("token", token, {
        expires: new Date(Date.now() + 7 * 8640000),
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
app.post("/signup", async (req, res) => {
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

app.post("/sendConnectionRequest", userAuth, async (req, res) => {
  const user = req.user;
  res.send(user.firstName + " sent the connection request!");
});

connectDB()
  .then(() => {
    console.log("Database connected successfully!");

    app.listen(4000, () => {
      console.log("Server is successfully listening on port 4000...");
    });
  })
  .catch((err) => {
    console.error("Database cannot be connected!!");
  });
