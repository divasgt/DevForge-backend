const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["ignored", "interested", "accepted", "rejected"],
        message: `{VALUE} is not a valid status type.`,
      },
    },
  },
  { timestamps: true },
);

connectionRequestSchema.index({ fromUserId: 1, toUserId: 1 });

// this is like a middleware, this wil be called before save method (before saving any collection)
// function to check if the fromUserId is same as toUserId
connectionRequestSchema.pre("save", function (next) {
  if (this.fromUserId.equals(this.toUserId)) {
    // new syntax of mongoose, than which is in the course video
    throw new Error("Cannot send connection request to yourself!");
  }
  // next(); // must call this akshay said, but this line is giving error: ERROR: next is not a function
});

const ConnectionRequest = mongoose.model(
  "ConnectionRequest",
  connectionRequestSchema,
);

module.exports = ConnectionRequest;
