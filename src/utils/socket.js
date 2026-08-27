const socket = require("socket.io");
const { allowedOrigins } = require("./constants");
const crypto = require("crypto");
const Chat = require("../models/chat");
const jwt = require("jsonwebtoken");

// using crypto to create hash to create a complex roomId, so any hacker can't guess
const getSecretRoomId = (userId, targetUserId) => {
  // below we did sort() because we need roomId to be same in both cases when userA creates room to msg userB and when userB creates room to msg userA.
  return crypto
    .createHash("sha256")
    .update([userId.toString(), targetUserId.toString()].sort().join("&"))
    .digest("hex");
};

const initializeSocket = (server) => {
  // config socket.io
  const io = socket(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  // Socket Authentication Middleware
  io.use((socket, next) => {
    try {
      const cookieString = socket.request.headers.cookie;
      if (!cookieString) throw new Error("No cookies found");

      // Parse cookies manually
      const cookies = cookieString.split(";").reduce((res, item) => {
        const data = item.trim().split("=");
        return { ...res, [data[0]]: data[1] };
      }, {});

      const token = cookies.token;
      if (!token) throw new Error("Token missing");

      const decodedObj = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decodedObj; // attach decoded user data (_id) to socket
      next();
    } catch (err) {
      console.error("Socket Auth Error:", err.message);
      next(new Error("Authentication error"));
    }
  });

  // to start listening to connections
  io.on("connection", (socket) => {
    // Event handlers
    socket.on("joinChat", ({ firstName, targetUserId }) => {
      // Use the authenticated user's ID, ignore whatever the client sent
      const userId = socket.user._id;

      const roomId = getSecretRoomId(userId, targetUserId);
      console.log(`${firstName} joined the room: ${roomId}`);

      socket.join(roomId);
    });

    socket.on("sendMessage", async ({ firstName, targetUserId, text }) => {
      try {
        const userId = socket.user._id;
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

        io.to(roomId).emit("messageRecieved", { firstName, text, senderId: userId });
      } catch (err) {
        console.error(err.message);
      }
    });

    socket.on("disconnect", () => {});
  });
};

module.exports = initializeSocket;
