const express = require("express");
const router = express.Router();

const {
  login,
  getProfile,
  logout
} = require("../controller/authController");

const authMiddleware = require("../middlewares/authMiddleware");

// Removed 'register' and 'resetPassword' until they are added to authController.js
router.post("/login", login);
router.get("/profile", authMiddleware, getProfile);
router.post("/logout", authMiddleware, logout);

module.exports = router;