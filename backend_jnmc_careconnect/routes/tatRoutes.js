const express = require("express");
const router = express.Router();
const tatController = require("../controller/tatController");
const { protect, authorize } = require("../middlewares/authMiddleware");

// TAT Stats - Admin Only
router.get(
  "/stats",
  protect,
  authorize("admin", "sub_admin"),
  tatController.getTatStats,
);

// Overdue Bookings - Admin & Lab
router.get(
  "/overdue",
  protect,
  authorize("admin", "sub_admin", "lab"),
  tatController.getOverdueBookings,
);

module.exports = router;
