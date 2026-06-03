const express = require("express");
const router = express.Router();
const { requestReportOTP, verifyReportOTP } = require("../controller/patientReportController");

// Route to request an OTP for report access
router.post("/request-otp", requestReportOTP);

// Route to verify the OTP and retrieve reports
router.post("/verify-otp", verifyReportOTP);

module.exports = router;