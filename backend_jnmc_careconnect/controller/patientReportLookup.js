const mongoose = require("mongoose");
const GeneralPublicPatient = require("../models/genernalPublic");
const PatientEmployee = require("../models/PatientEmployee");
const StudentPatient = require("../models/student");
const Booking = require("../models/booking");

// Controller: Patient Report Lookup

exports.patientReportLookup = async (req, res) => {
  try {
    // Accept either uhid or aadharNumber from request body
    const { uhid, aadharNumber } = req.body;
    const doctorId = req.user._id || req.user.id;

    if (!uhid && !aadharNumber) {
      return res
        .status(400)
        .json({ message: "UHID or Aadhaar Number is required" });
    }

    if (!doctorId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Doctor ID not found" });
    }

    const query = uhid ? { uhid } : { aadharNumber };

    //  Search for the patient in all three schemas in parallel
    const [general, employee, student] = await Promise.all([
      GeneralPublicPatient.findOne(query),
      PatientEmployee.findOne(query),
      StudentPatient.findOne(query),
    ]);

    // Resolve which patient type was found
    const patient = general || employee || student;

    if (!patient) {
      return res
        .status(404)
        .json({ message: "Patient not found with the provided details" });
    }

    //  Verify Assignment

    const isAssigned = await Booking.exists({
      uhid: patient.uhid,
      "referringDoctor.doctorId": doctorId,
    });

    if (!isAssigned) {
      return res.status(403).json({
        message:
          "Access Denied: You have not treated or been assigned to this patient.",
      });
    }

    // Get the Booking Data specific to this doctor
    const bookings = await Booking.find({
      uhid: patient.uhid,
      "referringDoctor.doctorId": doctorId,
    }).sort({ createdAt: -1 });

    // Log Activity
    const logActivity = require("../utils/logActivity");
    await logActivity({
      actorId: doctorId,
      actorName: req.user.name || "Doctor",
      actorType: "doctor",
      action: "VIEW_PATIENT_REPORTS",
      targetId: patient._id,
      targetType: "Patient",
      metadata: { uhid: patient.uhid, totalBookings: bookings.length },
    });

    // Return the combined view data
    return res.status(200).json({
      success: true,
      patientType: general ? "General" : employee ? "Employee" : "Student",
      patient: patient,
      bookings: bookings,
    });
  } catch (error) {
    console.error("Patient Lookup Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
