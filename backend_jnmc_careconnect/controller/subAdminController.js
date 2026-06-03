const Doctor = require("../models/Doctor");
const LabEmployee = require("../models/LabEmployee");
const SubAdmin = require("../models/SubAdmin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if sub admin exists
    const subAdmin = await SubAdmin.findOne({ email });
    if (!subAdmin) {
      return res
        .status(404)
        .json({ success: false, message: "Sub Admin not found." });
    }

    // Check password
    // Use bcrypt.compare if passwords are hashed, or direct comparison if not (based on other controllers)
    // Looking at authController, it uses bcrypt.compare AND fallback for plain text.
    // Let's stick to bcrypt.compare
    const isMatch = await bcrypt.compare(password, subAdmin.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    // Check status
    if (subAdmin.status !== "Active") {
      return res
        .status(403)
        .json({ success: false, message: "Account is inactive." });
    }

    // Generate Token ID
    const tokenId = Math.random().toString(36).substring(2);

    // Generate Token
    const token = jwt.sign(
      {
        userId: subAdmin._id,
        role: "sub_admin",
        department: subAdmin.department,
        name: subAdmin.name,
        jti: tokenId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    // Save Token to Database
    const Token = require("../models/Token");
    await new Token({
      userId: subAdmin._id,
      onModel: "SubAdmin",
      tokenId,
    }).save();

    // Log Login Activity
    const logActivity = require("../utils/logActivity");
    await logActivity({
      actorId: subAdmin._id,
      actorName: subAdmin.name,
      actorType: "sub_admin",
      action: "LOGIN",
      metadata: { department: subAdmin.department },
    });

    res.status(200).json({
      success: true,
      token,
      subAdmin: {
        id: subAdmin._id,
        name: subAdmin.name,
        email: subAdmin.email,
        department: subAdmin.department,
        role: "sub_admin",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addDoctor = async (req, res) => {
  try {
    // Force department to be the Sub Admin's department
    const department = req.user.department;
    const { name, doctorId, email, password, status, canVerifyTests } = req.body;

    const existingDoctor = await Doctor.findOne({
      $or: [{ email }, { doctorId }],
    });
    if (existingDoctor)
      return res
        .status(400)
        .json({ success: false, message: "Doctor already exists." });

    const newDoctor = new Doctor({
      name,
      department, // Locked to Sub Admin's department
      doctorId,
      email,
      password,
      status,
      canVerifyTests,
    });
    await newDoctor.save();

    // Log Activity
    const logActivity = require("../utils/logActivity");
    logActivity({
      actorId: req.user._id,
      actorName: req.user.name,
      actorType: "sub_admin",
      action: "CREATE_DOCTOR",
      targetId: newDoctor._id,
      targetType: "Doctor",
      metadata: { doctorName: newDoctor.name, department },
    });

    res.status(201).json({
      success: true,
      message: "Doctor added successfully to your department",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addLabEmployee = async (req, res) => {
  try {
    const department = req.user.department;
    // Added 'role' to destructuring
    const { name, employeeId, email, password, status, role } = req.body;

    const existingEmployee = await LabEmployee.findOne({
      $or: [{ email }, { employeeId }],
    });
    if (existingEmployee)
      return res
        .status(400)
        .json({ success: false, message: "Employee already exists." });

    // Included 'role' in the new employee instance
    const newEmployee = new LabEmployee({
      name,
      department, // Locked to Sub Admin's department
      employeeId,
      email,
      password,
      status,
      role,
    });
    await newEmployee.save();

    // Log Activity
    const logActivity = require("../utils/logActivity");
    logActivity({
      actorId: req.user._id,
      actorName: req.user.name,
      actorType: "sub_admin",
      action: "CREATE_EMPLOYEE",
      targetId: newEmployee._id,
      targetType: "LabEmployee",
      metadata: { employeeName: newEmployee.name, department, role },
    });

    res.status(201).json({
      success: true,
      message: "Lab Employee added successfully to your department",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDepartmentStaff = async (req, res) => {
  try {
    const department = req.user.department;

    // Find doctors in this department
    const doctors = await Doctor.find({ department })
      .select("-password")
      .lean();

    // Find lab employees in this department
    const labEmployees = await LabEmployee.find({ department })
      .select("-password")
      .lean();

    const formattedDoctors = doctors.map((d) => ({
      ...d,
      role: "doctor",
      subType: "Doctor",
    }));
    const formattedEmployees = labEmployees.map((e) => ({
      ...e,
      role: "lab_employee",
      subType: e.role,
    }));

    res.status(200).json({
      success: true,
      data: {
        doctors: formattedDoctors,
        labEmployees: formattedEmployees,
        all: [...formattedDoctors, ...formattedEmployees],
      },
      department,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
