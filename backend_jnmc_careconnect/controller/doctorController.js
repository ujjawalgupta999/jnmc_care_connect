const Doctor = require("../models/Doctor");
const jwt = require("jsonwebtoken");
const Token = require("../models/Token");
const Booking = require("../models/booking");

/**
 * Doctor Login (Admin-created doctors only)
 */
exports.doctorLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // find doctor
    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // check status
    if (doctor.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Doctor account is inactive",
      });
    }

    // password check
    const isMatch = await doctor.isPasswordCorrect(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate Token
    const tokenId = Math.random().toString(36).substring(2);
    const token = jwt.sign(
      { userId: doctor._id, role: "doctor", jti: tokenId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    await new Token({ userId: doctor._id, onModel: "Doctor", tokenId }).save();

    // Log Activity
    const logActivity = require("../utils/logActivity");
    await logActivity({
      actorId: doctor._id,
      actorName: doctor.name,
      actorType: "doctor",
      action: "LOGIN",
      metadata: { department: doctor.department },
    });

    // success response (no password)
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        department: doctor.department,
        doctorId: doctor.doctorId,
        email: doctor.email,
        status: doctor.status,
        type: "doctor",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.addMedication = async (req, res) => {
  try {
    const { bookingId, medications, medication } = req.body;
    const doctorId = req.user._id;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      "referringDoctor.doctorId": doctorId,
    });

    if (!booking) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: You are not authorized for this booking.",
      });
    }

    const medsToAdd = [];
    if (medications && Array.isArray(medications)) {
      medsToAdd.push(...medications);
    } else if (medication) {
      medsToAdd.push(medication);
    }

    if (medsToAdd.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No medications provided",
      });
    }

    const now = new Date(); // Use same timestamp for the batch

    medsToAdd.forEach((med) => {
      if (med.name) {
        booking.medications.push({
          name: med.name,
          dosage: med.dosage || "",
          instructions: med.instructions || "",
          prescribedAt: now,
        });
      }
    });

    await booking.save();

    // Log Activity
    const logActivity = require("../utils/logActivity");
    logActivity({
      actorId: doctorId,
      actorName: req.user.name || "Doctor",
      actorType: "doctor",
      action: "PRESCRIBE_MEDICATION",
      targetId: bookingId,
      targetType: "Booking",
      metadata: {
        medicationsCount: medsToAdd.length,
        medicationNames: medsToAdd.map((m) => m.name).join(", "),
      },
    });

    res.status(200).json({
      success: true,
      message: "Medications added successfully",
      medications: booking.medications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUnsignedReports = async (req, res) => {
  try {
    const { doctorId } = req.query;

    // Status filter: Result Released or Awaiting Sign-off
    const query = {
      status: { $in: ["Result Released", "Awaiting Sign-off"] },
    };

    // Simple matching for now
    if (doctorId) {
      // query["referringDoctor.doctorId"] = doctorId;
    }

    const reports = await Booking.find(query)
      .select("patientName uhid status tatTimestamps updatedAt")
      .sort({ "tatTimestamps.resultReleasedAt": -1 });

    res.status(200).json({ success: true, reports });
  } catch (error) {
    console.error("Fetch Unsigned Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch reports" });
  }
};
