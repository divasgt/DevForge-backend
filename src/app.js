require("dotenv").config();
const express = require("express");
const connectDB = require("./config/database");
const User = require("./models/user");
const { validateSignUpData } = require("./utils/validation");
const bcrypt = require("bcrypt");

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

// Update user by its id
app.patch("/user/:userId", async (req, res) => {
  const userId = req.params.userId;
  const data = req.body;

  const ALLOWED_UPDATES = ["photoUrl", "about", "gender", "age", "skills"];
  // check if each of the fields in data is in allowed updates array or not
  const isUpdateAllowed = Object.keys(data).every((k) =>
    ALLOWED_UPDATES.includes(k),
  );

  try {
    if (!isUpdateAllowed) {
      throw new Error("Update not allowed!");
    }
    if (data?.skills?.length > 10) {
      throw new Error("Skills cannot be more than 10!");
    }
    const user = await User.findByIdAndUpdate(userId, data, {
      returnDocument: "after",
      runValidators: true,
    });
    res.send("User updated successfully!");
  } catch (err) {
    res.status(400).send("Update failed: " + err?.message);
  }
});

// Update user with email id, here when invalid gender is passed, idk why error is not being handled
app.patch("/user", async (req, res) => {
  const { email: userEmail, newData } = req.body; // this is destructuring, using email field as userEmail variable
  console.log(userEmail, newData);
  try {
    const result = await User.updateOne(
      { email: userEmail },
      { ...newData },
      { runValidators: true },
    );
    console.log(result);
    if (result.matchedCount === 1 && result.modifiedCount === 1) {
      res.send("User data updated successfully!");
    }
  } catch (err) {
    res.send(400).send("Update failed: " + err.message);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    if (!user) {
      throw new Error("Invalid email id or password.");
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      throw new Error("Invalid email id or password");
    } else {
      res.send("Login successful!");
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
