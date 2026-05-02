const express = require("express");

const app = express();

app.get("/getUserData", (req, res, next) => {
  try {
    // Logic of DB call and get user data
    if (true) {
      throw new Error("Some error occured. Contact support.");
    }
    res.send("User data sent!");
  } catch (err) {
    // res.status(500).send(err.message);
    // or we can write below, which will call a middleware request handler with err in its parameter
    next(err);
  }
});

// this will not run unless next() is written in previous request handler.
app.use("/getUserData", (req, res) => {
  res.send("this res sent!");
});

// this "/" will handle all routes, so always keep it towards the end.
// this below have err in the request handler, so Express sees the thrown error and looks for an error-handling middleware (a middleware with signature (err, req, res, next)). If found, Express calls it with the error. No need to do next() in any previous request handler.
// AI said - this error-handling middleware’s mount path ("/") is unusual but works; typical pattern is app.use((err, req, res, next) => { ... }) so it applies to all routes.
app.use("/", (err, req, res, next) => {
  if (err) {
    // Log your error for me developer
    res.status(500).send(err.message || "Something went wrong.");
  }
});

app.listen(4000, () => {
  console.log("Server is successfully listening on port 4000...");
});
