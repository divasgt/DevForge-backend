const express = require("express");

const app = express();

const { adminAuth, userAuth } = require("./middlewares/auth");

app.use("/admin", adminAuth);

app.get("/user", userAuth, (req, res) => {
  res.send("User data sent!");
});

app.get("/admin/getAllData", (req, res) => {
  res.send("All data sent!");
});

app.listen(4000, () => {
  console.log("Server is successfully listening on port 4000...");
});
