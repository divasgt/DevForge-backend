const express = require("express");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

const requestRouter = express.Router();

requestRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const toUserId = req.params.toUserId;
      const status = req.params.status;

      // validating status
      const allowedStatuses = ["interested", "ignored"];
      if (!allowedStatuses.includes(status)) {
        return res
          .status(400)
          .json({ message: "Invalid status type: " + status });
      }

      // validating if toUser exists
      const toUser = await User.findById(toUserId);
      if (!toUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // checking if connection request already exists
      const existingConnectionRequest = await ConnectionRequest.findOne({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });
      if (existingConnectionRequest) {
        return res
          .status(400)
          .json({ message: "Connection request already exists!" });
      }

      const connectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });

      const data = await connectionRequest.save();

      res.json({
        message: "Connection request sent sucessfully!",
        data: data,
      });
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  },
);

requestRouter.post(
  "/request/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const loggedInUser = req.user;
      const { status, requestId } = req.params;

      // validate status
      const allowedStatuses = ["accepted", "rejected"];
      if (!allowedStatuses.includes(status)) {
        return res
          .status(400)
          .json({ message: "Invalid status type: " + status });
      }

      // check connection request exists with interested state, with requestId, with loggedInUser._id as toUserId
      const connectionRequest = await ConnectionRequest.findOne({
        _id: requestId,
        toUserId: loggedInUser._id,
        status: "interested",
      });
      if (!connectionRequest) {
        res.status(400).json({ message: "Connection request not found!" });
      }

      connectionRequest.status = status;
      const data = await connectionRequest.save();

      res.json({ message: "Connection request " + status, data });
    } catch (err) {
      res.status(400).json({ message: "ERROR: " + err.message });
    }
  },
);

module.exports = requestRouter;
