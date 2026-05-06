require("dotenv").config();
const express = require("express");
const connectDB = require("./config/database");
const User = require("./models/user");

const app = express();

// Middleware to read or accept json from requests. Without writing this, if we console.log(req.body) we will get undefined.
app.use(express.json());

// GET /user api, get user by email
app.get("/user", async (req, res) => {
  const userEmail = req.body.email;
  // console.log(userEmail);
  try {
    const users = await User.find({ email: userEmail });
    if (users.length != 0) {
      res.send(users);
    } else {
      res.status(404).send("User not found");
    }
  } catch (err) {
    res.status(400).send("Something went wrong!");
  }
});

// GET /feed api, get all users
app.get("/feed", async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (err) {
    res.status(400).send("Something went wrong!");
  }
});

// using findById
app.get("/findById", async (req, res) => {
  const userId = req.body.id;
  try {
    const user = await User.findById(userId);
    res.send(user);
  } catch (err) {
    res.send(400).send("Something went wrong!");
  }
});

// delete user
app.delete("/user", async (req, res) => {
  const userId = req.body.id;
  try {
    const result = await User.findByIdAndDelete(userId);
    console.log(result);
    if (result) {
      // && result instanceof User
      res.send("User deleted sucessfully!");
    } else {
      res.status(404).send("User not found!");
    }
  } catch (err) {
    res.status(400).send("Something went wrong!");
  }
});

// Update user with email id
app.patch("/user", async (req, res) => {
  const { email: userEmail, newData } = req.body; // this is destructuring, using email field as userEmail variable
  console.log(userEmail, newData);
  try {
    const result = await User.updateOne({ email: userEmail }, { ...newData });
    console.log(result);
    if (result.matchedCount === 1 && result.modifiedCount === 1) {
      res.send("User data updated successfully!");
    } else {
      res.status(400).send("User not found!");
    }
  } catch (err) {
    res.send(400).send("Something went wrong!");
  }
});

// Create new user
app.post("/signup", async (req, res) => {
  // creating a new instance of the User model
  const user1 = new User(req.body);

  try {
    await user1.save();
    res.send("User created successfully!");
  } catch (err) {
    res.status(400).send("Error creating the user: " + err.message);
  }
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
