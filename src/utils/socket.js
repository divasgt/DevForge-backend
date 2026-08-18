const socket = require("socket.io");
const { allowedOrigins } = require("./constants");
const crypto = require("crypto");

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

    socket.on("sendMessage", ({ firstName, userId, targetUserId, text }) => {
      const roomId = getSecretRoomId(userId, targetUserId);
      console.log(`${firstName} sent message: ${text}`);

      io.to(roomId).emit("messageRecieved", { firstName, text });
    });

    socket.on("disconnect", () => {});
  });
};

module.exports = initializeSocket;
