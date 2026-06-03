const User = require("../models/user");
const Token = require("../models/Token");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const StudentPatient = require("../models/student");
const PatientEmployee = require("../models/PatientEmployee");
const GeneralPublicPatient = require("../models/genernalPublic");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch && password !== user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const tokenId = Math.random().toString(36).substring(2);
    const token = jwt.sign(
      { userId: user._id, role: user.type || "user", jti: tokenId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    await new Token({ userId: user._id, onModel: "User", tokenId }).save();

    // Log Activity
    const logActivity = require("../utils/logActivity");
    await logActivity({
      actorId: user._id,
      actorName: user.name,
      actorType: (user.type || "user").toLowerCase(), // Ensure lowercase for Enum match
      action: "LOGIN",
      metadata: { ip: req.ip, userAgent: req.headers["user-agent"] },
    });

    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, type: user.type },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Convert keys to plain object to avoid mongoose wrapper issues
    let userData = user.toObject ? user.toObject() : { ...user };
    let detailedProfile = null;
    let patientType = "General"; // Default to General if nothing else matches but user exists

    // Use aadhar or uhid to find the detailed profile
    // Note: models use 'aadharNumber' (String) while User has 'aadhar' (Number).
    // We should cast to String for querying patient collections.
    const searchAadhar = user.aadhar ? String(user.aadhar) : null;

    if (searchAadhar) {
      // 1. Try Employee
      const employee = await PatientEmployee.findOne({
        aadharNumber: searchAadhar,
      });
      if (employee) {
        detailedProfile = employee;
        patientType = "Employee";
      }

      // 2. Try Student
      if (!detailedProfile) {
        const student = await StudentPatient.findOne({
          aadharNumber: searchAadhar,
        });
        if (student) {
          detailedProfile = student;
          patientType = "Student";
        }
      }

      // 3. Try General Public
      if (!detailedProfile) {
        const general = await GeneralPublicPatient.findOne({
          aadharNumber: searchAadhar,
        });
        if (general) {
          detailedProfile = general;
          patientType = "Patient";
        }
      }
    }

    // Attach the found details to the response
    res.json({
      ...userData,
      patientType,
      detailedKey: detailedProfile ? "found" : "not_found",
      // Merge detailed profile fields if found, but give precedence to User model critical auth fields if needed
      // or just return it as a separate object 'details'
      details: detailedProfile || {},
    });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res
      .status(500)
      .json({ message: "Error fetching profile", error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    // Check if jwtid exists before trying to access it
    if (req.user && req.user.jwtid) {
      await Token.deleteOne({ tokenId: req.user.jwtid });
    }

    // Log Activity if user is authenticated
    if (req.user) {
      const logActivity = require("../utils/logActivity");
      await logActivity({
        actorId: req.user._id, // Mongoose document has _id
        actorName: req.user.name || "Unknown",
        actorType: (req.user.role || req.user.type || "user").toLowerCase(),
        action: "LOGOUT",
      });
    }

    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
