const Doctor = require("../models/Doctor");
const LabEmployee = require("../models/LabEmployee");
const SubAdmin = require("../models/SubAdmin");

exports.addSubAdmin = async (req, res) => {
  try {
    const { name, department, subAdminId, email, password, status } = req.body;
    const existingSubAdmin = await SubAdmin.findOne({
      $or: [{ email }, { subAdminId }],
    });
    if (existingSubAdmin)
      return res
        .status(400)
        .json({ success: false, message: "Sub Admin already exists." });

    const newSubAdmin = new SubAdmin({
      name,
      department,
      subAdminId,
      email,
      password,
      status,
    });
    await newSubAdmin.save();

    // Log Activity
    const logActivity = require("../utils/logActivity");
    logActivity({
      actorId: req.user._id,
      actorName: "System Admin", // Since this is admin controller, usually it's the main admin
      actorType: "admin",
      action: "CREATE_SUB_ADMIN",
      targetId: newSubAdmin._id,
      targetType: "SubAdmin",
      metadata: { subAdminName: name, department },
    });

    res
      .status(201)
      .json({ success: true, message: "Sub Admin added successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSubAdmins = async (req, res) => {
  try {
    const subAdmins = await SubAdmin.find().select("-password");
    res.status(200).json({ success: true, data: subAdmins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addDoctor = async (req, res) => {
  try {
    const { name, department, doctorId, email, password, status, canVerifyTests } = req.body;
    const existingDoctor = await Doctor.findOne({
      $or: [{ email }, { doctorId }],
    });
    if (existingDoctor)
      return res
        .status(400)
        .json({ success: false, message: "Doctor already exists." });

    const newDoctor = new Doctor({
      name,
      department,
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
      actorName: "System Admin",
      actorType: "admin",
      action: "CREATE_DOCTOR",
      targetId: newDoctor._id,
      targetType: "Doctor",
      metadata: { doctorName: name, department },
    });

    res
      .status(201)
      .json({ success: true, message: "Doctor added successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addLabEmployee = async (req, res) => {
  try {
    // Added 'role' to destructuring
    const { name, department, employeeId, email, password, status, role } =
      req.body;

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
      department,
      employeeId,
      email,
      password,
      status,
      role,
    });
    await newEmployee.save();

    await newEmployee.save();

    // Log Activity
    const logActivity = require("../utils/logActivity");
    logActivity({
      actorId: req.user._id,
      actorName: "System Admin",
      actorType: "admin",
      action: "CREATE_EMPLOYEE",
      targetId: newEmployee._id,
      targetType: "LabEmployee",
      metadata: { employeeName: name, department, role },
    });

    res
      .status(201)
      .json({ success: true, message: "Lab Employee added successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSystemStats = async (req, res) => {
  try {
    const doctors = await Doctor.countDocuments();
    const labEmployees = await LabEmployee.countDocuments();
    res.status(200).json({ success: true, data: { doctors, labEmployees } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllStaff = async (req, res) => {
  try {
    const doctors = await Doctor.find().select("-password").lean();
    const labEmployees = await LabEmployee.find().select("-password").lean();
    const subAdmins = await SubAdmin.find().select("-password").lean();

    // Add 'role' for frontend consistency
    const formattedDoctors = doctors.map((d) => ({
      ...d,
      role: "doctor",
      subType: "Doctor",
    }));
    const formattedEmployees = labEmployees.map((e) => ({
      ...e,
      role: "lab",
      subType: e.role,
    }));
    const formattedSubAdmins = subAdmins.map((sa) => ({
      ...sa,
      role: "sub_admin",
      subType: "Sub Admin",
    }));

    res.status(200).json({
      success: true,
      data: {
        doctors: formattedDoctors,
        labEmployees: formattedEmployees,
        subAdmins: formattedSubAdmins,
        all: [
          ...formattedDoctors,
          ...formattedSubAdmins,
          ...formattedEmployees,
        ],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetStaffPassword = async (req, res) => {
  try {
    const { userId, role, newPassword } = req.body;

    if (!userId || !role || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "User ID, role, and new password are required.",
      });
    }

    let user;
    if (role === "doctor") {
      user = await Doctor.findById(userId);
    } else if (role === "sub_admin") {
      user = await SubAdmin.findById(userId);
    } else {
      user = await LabEmployee.findById(userId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found.",
      });
    }

    user.password = newPassword;
    await user.save();

    await user.save();

    // Log Activity
    const logActivity = require("../utils/logActivity");
    logActivity({
      actorId: req.user.userId,
      actorName: "System Admin",
      actorType: "admin",
      action: "RESET_PASSWORD",
      targetId: user._id,
      targetType:
        role === "doctor"
          ? "Doctor"
          : role === "sub_admin"
            ? "SubAdmin"
            : "LabEmployee",
      metadata: { staffName: user.name, role },
    });

    res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
