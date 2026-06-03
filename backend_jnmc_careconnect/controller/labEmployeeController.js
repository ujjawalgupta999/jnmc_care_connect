const LabEmployee = require("../models/LabEmployee");
const GeneralPublicPatient = require("../models/genernalPublic");
const StudentPatient = require("../models/student");
const PatientEmployee = require("../models/PatientEmployee");
const Token = require("../models/Token");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const QRcode = require("qrcode");
/**
 * Lab Employee Login (Admin-created employees only)
 */
exports.labEmployeeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // find employee
    const employee = await LabEmployee.findOne({ email });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Lab employee not found",
      });
    }

    // check account status
    if (employee.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Lab employee account is inactive",
      });
    }

    // password verification
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate Token
    const tokenId = Math.random().toString(36).substring(2);
    const token = jwt.sign(
      { userId: employee._id, role: "lab_employee", jti: tokenId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    await new Token({
      userId: employee._id,
      onModel: "LabEmployee",
      tokenId,
    }).save();

    // success response (password excluded)
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      employee: {
        id: employee._id,
        name: employee.name,
        department: employee.department,
        employeeId: employee.employeeId,
        email: employee.email,
        status: employee.status,
        role: employee.role,
        type: "lab",
      },
    });

    // Log Activity
    const logActivity = require("../utils/logActivity");
    await logActivity({
      actorId: employee._id,
      actorName: employee.name,
      actorType: "lab_employee", // or "lab" as user type is now supported
      action: "LOGIN",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.checkAadhar = async (req, res) => {
  try {
    const { aadharNumber } = req.body;

    if (!aadharNumber || aadharNumber.length !== 12) {
      return res.status(400).json({
        success: false,
        message: "Valid 12-digit Aadhaar number required",
      });
    }

    // 1. Check General Public Patient
    const generalPatient = await GeneralPublicPatient.findOne({ aadharNumber });
    if (generalPatient) {
      return res.status(200).json({
        success: true,
        exists: true,
        category: "General",
        patient: generalPatient,
      });
    }

    // 2. Check Student Patient
    const studentPatient = await StudentPatient.findOne({ aadharNumber });
    if (studentPatient) {
      return res.status(200).json({
        success: true,
        exists: true,
        category: "Student",
        patient: studentPatient,
      });
    }

    // 3. Check Patient Employee
    const patientEmployee = await PatientEmployee.findOne({ aadharNumber });
    if (patientEmployee) {
      return res.status(200).json({
        success: true,
        exists: true,
        category: "Patient Employee",
        patient: patientEmployee,
      });
    }

    // 4. Not found
    res.status(200).json({
      success: true,
      exists: false,
      message: "New patient – proceed to registration",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.createGeneralPatient = async (req, res) => {
  try {
    const patient = await GeneralPublicPatient.create(req.body);

    res.status(201).json({
      success: true,
      message: "General public patient registered successfully",
      patient,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.createStudentPatient = async (req, res) => {
  try {
    const patient = await StudentPatient.create(req.body);

    res.status(201).json({
      success: true,
      message: "Student patient registered successfully",
      patient,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.createPatientEmployee = async (req, res) => {
  try {
    const patient = await PatientEmployee.create(req.body);

    res.status(201).json({
      success: true,
      message: "Patient employee registered successfully",
      patient,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.checkAadhar = async (req, res) => {
  try {
    const { aadharNumber } = req.body;

    if (!aadharNumber || aadharNumber.length !== 12) {
      return res.status(400).json({
        success: false,
        message: "Valid 12-digit Aadhaar number required",
      });
    }

    let patient = null;
    let patientType = null;

    // 1️⃣ Patient Employee
    patient = await PatientEmployee.findOne({ aadharNumber });
    if (patient) patientType = "Employee";

    // 2️⃣ Student
    if (!patient) {
      patient = await StudentPatient.findOne({ aadharNumber });
      if (patient) patientType = "Student";
    }

    // 3️⃣ General Public
    if (!patient) {
      patient = await GeneralPublicPatient.findOne({ aadharNumber });
      if (patient) patientType = "General";
    }

    // 4️⃣ New Patient
    if (!patient) {
      return res.status(200).json({
        success: true,
        exists: false,
        message: "New patient – proceed to registration",
      });
    }

    // 📦 QR payload (SAFE DATA)
    const qrPayload = JSON.stringify({
      uhid: patient.uhid,
      patientType,
      mobile: patient.phone,
      generatedAt: new Date().toISOString(),
    });

    // 🧾 Generate QR Code (Base64)
    const qrCode = await QRcode.toDataURL(qrPayload);

    const response = {
      success: true,
      exists: true,
      patientType,

      patientInfo: {
        patient,
      },
      qrCode,
    };

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
