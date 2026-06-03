const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const isAdmin = require("../middlewares/isAdmin");
const {
  getSettings,
  updateSetting,
  getHospitalCharges,
  updateHospitalCharges,
} = require("../controller/settingsController");

// All settings routes require admin auth
router.use(authMiddleware);
router.use(isAdmin);

// Get all settings or filter by category/key
router.get("/", getSettings);

// Update or create a setting by key
router.put("/:key", updateSetting);

// Hospital charges specific endpoints (can be public for reading)
router.get("/hospital-charges", getHospitalCharges);
router.put("/hospital-charges", updateHospitalCharges);

module.exports = router;
