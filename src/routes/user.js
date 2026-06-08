const express = require("express");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

const userRouter = express.Router();

const SAFE_USER_DATA = "firstName lastName photoUrl age gender about skills";

// get all pending connection request for logged in user
userRouter.get("/user/request/recieved", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", SAFE_USER_DATA);

    res.json({
      message: "Data fetched sucessfully.",
      data: connectionRequests,
    });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUser._id, status: "accepted" },
        { toUserId: loggedInUser._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", SAFE_USER_DATA)
      .populate("toUserId", SAFE_USER_DATA);

    const connections = connectionRequests.map((row) => {
      if (row.fromUserId._id.toString() === loggedInUser._id.toString()) {
        return row.toUserId;
      } else {
        return row.fromUserId;
      }
    });

    res.json({
      message: "Data fetched sucessfully.",
      data: connections,
    });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

userRouter.get("/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    const connectionRequests = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    }).select("fromUserId toUserId");

    const userIdsToNotShow = connectionRequests.map((row) => {
      if (row.fromUserId._id.toString() === loggedInUser._id.toString()) {
        return row.toUserId.toString();
      } else {
        return row.fromUserId.toString();
      }
    });
    userIdsToNotShow.push(loggedInUser._id.toString());

    /* My way:
    const allUsers = await User.find({});
    // $nor: [{ _id: loggedInUser._id }],

    const feedUsers = allUsers.filter((user) => {
      return !userIdsToNotShow.includes(user._id.toString());
    });
    */

    // Akshay's way:
    // this shows all users whose id is not in userIdsToNotShow array
    const feedUsers = await User.find({
      _id: { $nin: userIdsToNotShow },
    })
      .select(SAFE_USER_DATA)
      .skip(skip)
      .limit(limit);

    res.json({ data: feedUsers });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

userRouter.get("/user/ignored-users", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      status: "ignored",
      fromUserId: loggedInUser._id,
    }).populate("toUserId", SAFE_USER_DATA);

    const ignoredUsers = connectionRequests.map((row) => row.toUserId);

    res.json({ message: "Data fetched sucessfully!", data: ignoredUsers });
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

module.exports = userRouter;
