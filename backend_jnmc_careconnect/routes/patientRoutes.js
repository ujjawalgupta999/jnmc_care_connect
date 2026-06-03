const express = require("express");
const router = express.Router();
const { registerPatient } = require("../controller/patientController");

// Self-registration endpoint
router.post("/register", registerPatient);

module.exports = router;
