const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const isSubAdmin = require("../middlewares/isSubAdmin");
const {
  addDoctor,
  addLabEmployee,
  getDepartmentStaff,
  login,
} = require("../controller/subAdminController");

// Public routes
router.post("/login", login);

// Protected routes
router.use(authMiddleware);
router.use(isSubAdmin);

router.post("/add-doctor", addDoctor);
router.post("/add-lab-employee", addLabEmployee);
router.get("/my-staff", getDepartmentStaff);

module.exports = router;
