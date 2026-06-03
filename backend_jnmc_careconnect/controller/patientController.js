const GeneralPublicPatient = require("../models/genernalPublic");
const StudentPatient = require("../models/student");
const PatientEmployee = require("../models/PatientEmployee");

exports.registerPatient = async (req, res) => {
  try {
    const {
      name,
      gender,
      age,
      phone,
      address,
      patientType,
      enrollmentNumber,
      employeeId,
    } = req.body;

    // Basic Validation
    if (!name || !gender || !age || !phone || !address || !patientType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields.",
      });
    }

    // Calculate approx date of birth from age
    const currentYear = new Date().getFullYear();
    const dateOfBirth = new Date(`${currentYear - age}-01-01`);

    let newPatient;
    const baseData = {
      name,
      gender,
      dateOfBirth,
      phone,
      address, // For General Public it's a string, for Student/Employee it's an object, let's normalize or pass as is
    };

    if (patientType === "student") {
      if (!enrollmentNumber) {
        return res.status(400).json({
          success: false,
          message: "Enrollment number is required for students.",
        });
      }
      newPatient = await StudentPatient.create({
        ...baseData,
        enrollmentNumber,
        address: { dist: address, city: "Unknown", state: "Unknown", pinCode: "000000" },
      });
    } else if (patientType === "employee") {
      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: "Employee ID is required for employees.",
        });
      }
      newPatient = await PatientEmployee.create({
        ...baseData,
        employeeId,
        address: { dist: address, city: "Unknown", state: "Unknown", pinCode: "000000" },
      });
    } else {
      // General Public
      newPatient = await GeneralPublicPatient.create({
        ...baseData,
        address,
        city: "Unknown",
        state: "Unknown",
        pinCode: "000000",
      });
    }

    res.status(201).json({
      success: true,
      message: "Patient registered successfully",
      uhid: newPatient.uhid,
      patientType,
    });
  } catch (error) {
    console.error("Patient Registration Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to register patient.",
    });
  }
};
