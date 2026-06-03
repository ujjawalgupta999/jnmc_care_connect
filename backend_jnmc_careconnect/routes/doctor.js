const { Router } = require("express");
const doctorController = require("../controller/doctorController");
const patientReportLookup = require("../controller/patientReportLookup");
const isDoctor = require("../middlewares/isDoctor");
const authMiddleware = require("../middlewares/authMiddleware");
const router = Router();

const { doctorLogin, addMedication, getUnsignedReports } = doctorController;

router.post("/login", doctorLogin);

router.get("/unsigned-reports", getUnsignedReports);

router.post(
  "/patient-reports",
  authMiddleware,
  isDoctor,
  patientReportLookup.patientReportLookup,
);

router.post("/add-medication", authMiddleware, isDoctor, addMedication);

module.exports = router;
