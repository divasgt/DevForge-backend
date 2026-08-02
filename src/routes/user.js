const express = require("express");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const { parsePromptWithAI } = require("../services/aiService");

const userRouter = express.Router();

const SAFE_USER_DATA =
  "firstName lastName photoUrl age gender about skills socialLinks specialization experience city country lookingFor company status contactEmail";

// get all pending connection request for logged in user
userRouter.get("/user/request/recieved", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", SAFE_USER_DATA);

    const validRequests = connectionRequests.filter(
      (req) => req.fromUserId != null
    );

    res.json({
      message: "Data fetched sucessfully.",
      data: validRequests,
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

    const connections = connectionRequests
      .filter((row) => row.fromUserId != null && row.toUserId != null)
      .map((row) => {
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

    const filter = {
      _id: { $nin: userIdsToNotShow },
    };

    // Adding filters from query params
    if (req.query.minAge) {
      filter.age = { $gte: Number(req.query.minAge) };
    }
    if (req.query.maxAge) {
      filter.age = { ...filter.age, $lte: Number(req.query.maxAge) };
    }
    if (req.query.city) {
      filter.city = { $regex: req.query.city.trim(), $options: "i" }; // case-insensitive search
    }
    if (req.query.country) {
      filter.country = { $regex: req.query.country.trim(), $options: "i" };
    }
    if (req.query.specialization) {
      const specArray = req.query.specialization
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (specArray.length > 0) {
        filter.specialization = {
          $in: specArray.map((s) => new RegExp(`^${s}$`, "i")),
        };
      }
    }
    if (req.query.minExp) {
      filter.experience = { $gte: Number(req.query.minExp) };
    }
    if (req.query.maxExp) {
      filter.experience = { ...filter.experience, $lte: Number(req.query.maxExp) };
    }

    const allowedStatusValues = ["employed", "self-employed", "freelance", "student", "hobbyist"];
    if (req.query.status) {
      const statusArray = req.query.status
        .split(",")
        .map((c) => c.trim().toLowerCase())
        .filter((c) => allowedStatusValues.includes(c));

      if (statusArray.length > 0) {
        filter.status = { $in: statusArray };
      }
    }
    if (req.query.skills) {
      const skillsArray = req.query.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (skillsArray.length > 0) {
        filter.skills = {
          $in: skillsArray.map((s) => new RegExp(`^${s}$`, "i")),
        };
      }
    }

    const feedUsers = await User.find(filter).select(SAFE_USER_DATA).skip(skip).limit(limit);

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

    const ignoredUsers = connectionRequests
      .filter((row) => row.toUserId != null)
      .map((row) => row.toUserId);

    res.json({ message: "Data fetched sucessfully!", data: ignoredUsers });
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

userRouter.get("/user/:userId", userAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedInUser = req.user;

    const user = await User.findById(userId).select(SAFE_USER_DATA);

    if (!user) {
      throw new Error("User not found!");
    }

    let connectionData = null;
    if (userId.toString() !== loggedInUser._id.toString()) {
      const connectionRequest = await ConnectionRequest.findOne({
        $or: [
          { fromUserId: loggedInUser._id, toUserId: userId },
          { fromUserId: userId, toUserId: loggedInUser._id },
        ],
      });

      if (connectionRequest) {
        connectionData = {
          _id: connectionRequest._id,
          status: connectionRequest.status,
          senderId: connectionRequest.fromUserId,
        };
      }
    }

    res.json({ data: user, connectionData });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

// AI Search for Feed
userRouter.post("/feed/ai-search", userAuth, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: "Search prompt is required" });
    }

    const filters = await parsePromptWithAI(prompt);
    res.json({ message: "Successfully parsed search prompt", data: filters });
  } catch (err) {
    console.error("AI Search API Error:", err);
    res.status(500).json({ message: err.message || "Failed to process AI search" });
  }
});

module.exports = userRouter;
