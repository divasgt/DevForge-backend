const express = require("express");
const Chat = require("../models/chat");
const { userAuth } = require("../middlewares/auth");

const chatRouter = express.Router();

// fetch chat history or create new chat if it does not exist
chatRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {
  const { targetUserId } = req.params;
  const userId = req.user._id;

  try {
    let chat = await Chat.findOne({ participants: { $all: [userId, targetUserId] } }).populate({
      path: "messages.senderId",
      select: "firstName lastName",
    });

    if (!chat) {
      chat = new Chat({
        participants: [userId, targetUserId],
        messages: [],
      });
      await chat.save();
    }

    res.json({ data: chat, message: "Chat fetched successfully!" });
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ message: "Error:" + err.message });
  }
});

module.exports = chatRouter;
