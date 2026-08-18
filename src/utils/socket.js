const socket = require("socket.io");
const { allowedOrigins } = require("./constants");
const crypto = require("crypto");
const Chat = require("../models/chat");

// using crypto to create hash to create a complex roomId, so any hacker can't guess
const getSecretRoomId = (userId, targetUserId) => {
  return crypto.createHash("sha256").update([userId, targetUserId].sort().join("&")).digest("hex");
};

const initializeSocket = (server) => {
  // config socket.io
  const io = socket(server, {
    cors: {
      origin: allowedOrigins,
    },
  });

  // to start listening to connections
  io.on("connection", (socket) => {
    // Event handlers
    socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
      // below we did sort() because we need roomId to be same in both cases when userA creates room to msg userB and when userB creates room to msg userA.
      const roomId = getSecretRoomId(userId, targetUserId);
      console.log(`${firstName} joined the room: ${roomId}`);

      socket.join(roomId);
    });

    socket.on("sendMessage", async ({ firstName, userId, targetUserId, text }) => {
      try {
        const roomId = getSecretRoomId(userId, targetUserId);
        console.log(`${firstName} sent message: ${text}`);

        // Save message to db
        let chat = await Chat.findOne({
          participants: { $all: [userId, targetUserId] },
        });

        // create chat if it does not exist
        if (!chat) {
          chat = new Chat({
            participants: [userId, targetUserId],
            messages: [],
          });
        }

        // push the new message to chat
        chat.messages.push({ senderId: userId, text });
        await chat.save();

        io.to(roomId).emit("messageRecieved", { firstName, text });
      } catch (err) {
        console.error(err.message);
      }
    });

    socket.on("disconnect", () => {});
  });
};

module.exports = initializeSocket;
