const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const isAdmin = require("../middlewares/isAdmin");
const { getExecutiveStats } = require("../controller/dashboardController");

router.get("/executive-stats", authMiddleware, isAdmin, getExecutiveStats);

module.exports = router;