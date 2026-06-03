const GeneralPublicPatient = require("../models/genernalPublic");
const StudentPatient = require("../models/student");
const PatientEmployee = require("../models/PatientEmployee");
const Booking = require("../models/booking");
const axios = require("axios");

// Retrieve values from environment variables
const EMS_API_URL = process.env.EMS_API_URL;
const API_KEY = process.env.EMS_API_KEY;
const TARGET_USER = process.env.EMS_TARGET_USER;

const otpCache = new Map();

exports.requestReportOTP = async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Identifier (UHID, Aadhaar, or Booking ID) is required",
      });
    }

    let searchIdentifier = identifier;
    let patient = null;

    // Check if identifier is a Booking ID (ObjectId)
    const mongoose = require("mongoose");
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      const booking = await Booking.findById(identifier);
      if (booking) {
        // If it's a booking ID, we look up the patient associated with that booking
        const query = { _id: booking.patientId };
        patient = await GeneralPublicPatient.findOne(query);
        if (!patient) patient = await StudentPatient.findOne(query);
        if (!patient) patient = await PatientEmployee.findOne(query);

        // Use the booking ID itself as the cache key for this session
        searchIdentifier = identifier;
      }
    }

    if (!patient) {
      // Fallback to UHID or Aadhaar search
      const query = {
        $or: [{ uhid: identifier }, { aadharNumber: identifier }],
      };
      patient = await GeneralPublicPatient.findOne(query);
      if (!patient) patient = await StudentPatient.findOne(query);
      if (!patient) patient = await PatientEmployee.findOne(query);
      searchIdentifier = identifier;
    }

    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient record not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    otpCache.set(searchIdentifier, { otp, expires: Date.now() + 300000 });

    // Log the OTP to the backend console instead of sending to the external API
    console.log(`\n============================`);
    console.log(`OTP for ${searchIdentifier}: ${otp}`);
    console.log(`============================\n`);

    /*
    await axios.post(
      EMS_API_URL,
      {
        title: "Your Verification Code",
        body: `Your OTP for JNMC CareConnect is: ${otp} it is valid for 5 minutes. Do not share this code with anyone.`,
        target_type: "segment",
        target_filter: { user_id: TARGET_USER },
        data: {
          type: "otp",
          code: otp.toString(),
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      },
    );
    */

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      devOtp: otp // Send OTP back for development purposes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message,
    });
  }
};

exports.verifyReportOTP = async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    const record = otpCache.get(identifier);

    if (!record || Date.now() > record.expires) {
      return res
        .status(400)
        .json({ success: false, message: "OTP expired or not requested" });
    }

    if (record.otp.toString() === otp.toString()) {
      otpCache.delete(identifier);

      let patient = null;

      // Handle bookingId identifier
      const mongoose = require("mongoose");
      if (mongoose.Types.ObjectId.isValid(identifier)) {
        const booking = await Booking.findById(identifier);
        if (booking) {
          patient = await GeneralPublicPatient.findById(booking.patientId);
          if (!patient)
            patient = await StudentPatient.findById(booking.patientId);
          if (!patient)
            patient = await PatientEmployee.findById(booking.patientId);
        }
      }

      if (!patient) {
        const query = {
          $or: [{ uhid: identifier }, { aadharNumber: identifier }],
        };
        patient = await GeneralPublicPatient.findOne(query);
        if (!patient) patient = await StudentPatient.findOne(query);
        if (!patient) patient = await PatientEmployee.findOne(query);
      }

      if (!patient) {
        return res
          .status(404)
          .json({ success: false, message: "Patient not found" });
      }

      const reports = await Booking.find({ uhid: patient.uhid }).sort({
        createdAt: -1,
      });

      // Calculate total unique tests across all reports
      const totalTestsCount = reports.reduce(
        (acc, report) => acc + (report.tests ? report.tests.length : 0),
        0,
      );

      // Log Activity
      const logActivity = require("../utils/logActivity");
      await logActivity({
        actorId: patient._id,
        actorName: patient.name,
        actorType: "user",
        action: "VIEW_REPORTS",
        targetId: identifier, // UHID or Booking ID used for lookup
        targetType: "Patient/Booking",
        metadata: { totalReports: reports.length, totalTests: totalTestsCount },
      });

      return res.status(200).json({
        success: true,
        message: "Verified successfully",
        patient: {
          name: patient.name,
          uhid: patient.uhid,
        },
        totalReports: reports.length,
        totalTestsAssociated: totalTestsCount,
        reports,
      });
    }
    res.status(401).json({ success: false, message: "Invalid OTP" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
