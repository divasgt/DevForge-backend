const express = require("express");
const connectDB = require("./config/database");
const User = require("./models/user");

const app = express();

app.post("/signup", async (req, res) => {
  const userObj = {
    firstName: "Akshay",
    lastName: "Saini",
    email: "akshay@saini.com",
    password: "akshaykapassword",
  };
  const user1 = User(userObj);

  // always do error handling, otherwise we wil always get "User created successfully!" even when user is not created in database.
  try {
    await user1.save();
    res.send("User created successfully!");
  } catch (err) {
    res.status(400).send("Error creating the user: " + err.message);
  }
});

// we are doing like this so that first database should be connected and then server should start listening for requrests. Otherwise server starts listening first and database connected later on, so this can cause error when someone sent request for database.
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
