const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const isAdmin = require("../middlewares/isAdmin");
const { getLogs, getLogStats } = require("../controller/logController");

// Construct the router
router.use(authMiddleware);
router.use(isAdmin);

router.get("/", getLogs);
router.get("/stats", getLogStats);

module.exports = router;
