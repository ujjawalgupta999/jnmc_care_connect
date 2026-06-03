const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const isAdmin = require("../middlewares/isAdmin");
const {
  addDoctor,
  addLabEmployee,
  addSubAdmin,
  getSubAdmins,
  getSystemStats,
  getAllStaff,
  resetStaffPassword,
} = require("../controller/adminController");
const {
  getExecutiveStats,
  getFinancialStats,
} = require("../controller/dashboardController");

router.use(authMiddleware);
router.use(isAdmin);

router.post("/add-doctor", addDoctor);
router.post("/add-lab-employee", addLabEmployee);
router.post("/add-sub-admin", addSubAdmin); // New route
router.get("/sub-admins", getSubAdmins); // New route
router.get("/stats", getSystemStats); // Likely unused now, but keeping for safety
router.get("/all-staff", getAllStaff);
router.post("/reset-staff-password", resetStaffPassword);
router.get("/dashboard/executive-stats", getExecutiveStats);
router.get("/financial-stats", getFinancialStats);
module.exports = router;
