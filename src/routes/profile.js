const express = require("express");
const { userAuth } = require("../middlewares/auth");
const { validatePassword } = require("../utils/validation");
const bcrypt = require("bcrypt");

const profileRouter = express.Router();

profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    const newData = req.body;
    const user = req.user;

    const ALLOWED_FIELDS = [
      "firstName",
      "lastName",
      "gender",
      "photoUrl",
      "about",
      "skills",
    ];

    const isEditAllowed = Object.keys(newData).every((field) =>
      ALLOWED_FIELDS.includes(field),
    );

    if (!isEditAllowed) {
      throw new Error("Invalid edit request!");
    } else {
      // updating the fields in user object
      Object.keys(newData).forEach((field) => (user[field] = newData[field]));
      await user.save();

      res.json({
        message: `${user.firstName}, your profile is updated successfully!`,
        data: user,
      });
    }
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

// Forgot password API
profileRouter.patch("/profile/password", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw new Error("Current password and new password are required.");
    }

    // validate current password
    const isCurrentPasswordValid = await user.validatePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is not valid!");
    }

    // validate new password
    validatePassword(newPassword);

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    user.password = newPasswordHash;
    await user.save();
    res.send("Password updated successfully!");
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

module.exports = profileRouter;
