const { Router } = require("express");
const labEmployeeController = require("../controller/labEmployeeController");

const router = Router();

// Employee Staff Login
router.post("/login", labEmployeeController.labEmployeeLogin);
router.post("/check-aadhar", labEmployeeController.checkAadhar);

router.post("/patient/general", labEmployeeController.createGeneralPatient);
router.post("/patient/student", labEmployeeController.createStudentPatient);
router.post("/patient/employee", labEmployeeController.createPatientEmployee);
router.post("/api/employee", labEmployeeController.checkAadhar);

module.exports = router;
