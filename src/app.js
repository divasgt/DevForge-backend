require("dotenv").config();
const express = require("express");
const connectDB = require("./config/database");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");
const cors = require("cors");

const app = express();

// Trust reverse proxy (needed for secure cookies in production behind Render/Heroku/Vercel)
app.set("trust proxy", 1);

// allowed origins
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173'
];

// to allow requests from specified origins (frontend)
app.use(cors({
  origin: allowedOrigins,
  credentials: true, // Crucial if you are passing HTTP-only cookies or authorization headers
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ['Content-Type', 'Authorization', "x-requested-with"]
}));
// Middleware to read or accept json from requests. Without writing this, if we console.log(req.body) we will get undefined.
app.use(express.json());
// Middleware to read cookies, without writing this, if we console.log(req.cookies) we get undefined.
app.use(cookieParser());

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);

connectDB()
  .then(() => {
    console.log("Database connected successfully!");

    const port = process.env.PORT || 7777;
    app.listen(port, () => {
      console.log(`Server is successfully listening on port ${port}...`);
    });
  })
  .catch((err) => {
    console.error("Database cannot be connected!!");
  });
