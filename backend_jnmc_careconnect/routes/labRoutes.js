const express = require("express");
const router = express.Router();
const Aadhaar = require("../models/aadhaar");
const User = require("../models/user");
const Doctor = require("../models/Doctor");
const upload = require("../middleware/uploadMiddleware");
const imageUpload = require("../middleware/imageUploadMiddleware");
const { uploadToR2, getPublicPdfUrl } = require("../utils/r2Config");
const fs = require("fs");

/**
 * GET /api/lab/doctors
 * Fetch all active doctors for referral dropdown
 */
router.get("/doctors", async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: "Active" })
      .select("_id name department doctorId")
      .sort({ name: 1 });
    res.status(200).json({ success: true, doctors });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch doctors" });
  }
});

/**
 * POST /api/lab/check-aadhaar
 * Check if Aadhaar exists in dummy DB and if user is already registered
 */
router.post("/check-aadhaar", async (req, res) => {
  try {
    const { aadhaar } = req.body;

    if (!aadhaar) {
      return res.status(400).json({
        success: false,
        message: "Aadhaar number is required",
      });
    }

    // Remove spaces from aadhaar for lookup
    const cleanAadhaar = aadhaar.replace(/\s/g, "");

// Step 1: Check if user already exists in our system (Check all patient types by UHID or Aadhaar)
    const GeneralPublicPatient = require("../models/genernalPublic");
    const StudentPatient = require("../models/student");
    const PatientEmployee = require("../models/PatientEmployee");

    const query = { $or: [{ uhid: cleanAadhaar }, { aadharNumber: cleanAadhaar }] };
    
    let existingUser = await GeneralPublicPatient.findOne(query);
    let existingType = "General";

    if (!existingUser) {
      existingUser = await StudentPatient.findOne(query);
      existingType = "Student";
    }

    if (!existingUser) {
      existingUser = await PatientEmployee.findOne(query);
      existingType = "Employee";
    }

    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: "Patient already registered",
        code: "USER_EXISTS",
        user: {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          phone: existingUser.phone,
          uhid: existingUser.uhid,
          type: existingType,
        },
      });
    }

    // Step 2: Check if Aadhaar exists in the dummy Aadhaar DB (only if it looks like Aadhaar)
    if (cleanAadhaar.length === 12 || cleanAadhaar.length === 16) {
      const aadhaarRecord = await Aadhaar.findOne({ aadhaar_no: cleanAadhaar });
      if (aadhaarRecord) {
        return res.status(200).json({
          success: true,
          message: "Aadhaar verified. User not registered.",
          code: "NEW_USER",
          aadhaarData: {
            aadhaar: cleanAadhaar,
            name: aadhaarRecord.name,
            dob: aadhaarRecord.dob,
            phone: aadhaarRecord.contact_number,
            address: aadhaarRecord.address,
          },
        });
      }
    }

    return res.status(404).json({
      success: false,
      message: "Patient not found in records.",
      code: "NOT_FOUND",
    });
  } catch (error) {
    console.error("Lookup error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while checking records",
    });
  }
});

const Test = require("../models/test");
const Booking = require("../models/booking");
const Counter = require("../models/counter");

/**
 * GET /api/lab/tests
 * Fetch all available tests from medical_db
 */
router.get("/tests", async (req, res) => {
  try {
    const tests = await Test.find({}).sort({ testName: 1 });
    res.status(200).json({ success: true, tests });
  } catch (error) {
    console.error("Error fetching tests:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tests" });
  }
});

/**
 * POST /api/lab/booking/preview
 * Generate preview Receipt No and Sample ID WITHOUT saving to DB
 * Just peeks at the next counter values
 */
router.post("/booking/preview", async (req, res) => {
  try {
    const { patientName } = req.body;

    // Peek at the next counter values (don't increment yet)
    const receiptCounter = await Counter.findOne({ name: "receiptNo" });
    const sampleCounter = await Counter.findOne({ name: "sampleId" });

    const nextReceiptSeq = (receiptCounter?.seq || 0) + 1;
    const nextSampleSeq = (sampleCounter?.seq || 0) + 1;

    const receiptNo = `INV-${nextReceiptSeq.toString().padStart(3, "0")}`;

    const namePrefix = (patientName || "UNK")
      .replace(/[^a-zA-Z]/g, "")
      .substring(0, 3)
      .toUpperCase()
      .padEnd(3, "X");
    const sampleId = `${namePrefix}${nextSampleSeq.toString().padStart(4, "0")}`;

    res.status(200).json({
      success: true,
      receiptNo,
      sampleId,
    });
  } catch (error) {
    console.error("Preview generation failed:", error);
    res
      .status(500)
      .json({ success: false, message: "Preview generation failed" });
  }
});

/**
 * POST /api/lab/booking/confirm
 * Confirm booking - increments counters and saves to DB
 */
router.post("/booking/confirm", async (req, res) => {
  console.log("Received booking request:", JSON.stringify(req.body, null, 2));

  try {
    let {
      patientId,
      patientType,
      uhid,
      patientName,
      tests,
      totalAmount,
      paymentMode,
      collectorName,
      referringDoctor,
    } = req.body;

    // Validate required fields
    if (!patientId || !tests || tests.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid booking data: Missing required fields (Patient ID or Tests)",
      });
    }

    // Validate Referring Doctor
    if (
      !referringDoctor ||
      !referringDoctor.doctorId ||
      !referringDoctor.name
    ) {
      console.warn("Missing referring doctor details:", referringDoctor);
      return res.status(400).json({
        success: false,
        message: "Referring Doctor is required with ID and Name.",
      });
    }

    // Map patientType from frontend "General"/"Student"/"Employee" to Model names
    let modelName = "GeneralPublicPatient";
    const PatientModels = {
      General: require("../models/genernalPublic"),
      Student: require("../models/student"),
      Employee: require("../models/PatientEmployee"),
    };

    let PatientModel = PatientModels.General;

    if (patientType === "Student") {
      modelName = "StudentPatient";
      PatientModel = PatientModels.Student;
    } else if (patientType === "Employee") {
      modelName = "PatientEmployee";
      PatientModel = PatientModels.Employee;
    }

    // Fallback: If UHID is missing, try to fetch it from the patient record
    if (!uhid) {
      console.log(
        `UHID missing for patient ${patientId}. Attempting to fetch...`,
      );
      try {
        const mongoose = require("mongoose");
        if (!mongoose.Types.ObjectId.isValid(patientId)) {
          throw new Error("Invalid Patient ID format");
        }

        const patientRecord = await PatientModel.findById(patientId);
        if (patientRecord && patientRecord.uhid) {
          uhid = patientRecord.uhid;
          console.log(`Fetched UHID: ${uhid}`);
        } else {
          console.warn(`Could not find UHID for patient ${patientId}`);
          return res.status(400).json({
            success: false,
            message: "Patient UHID is missing and could not be found.",
          });
        }
      } catch (fetchErr) {
        console.error("Error fetching patient for UHID fallback:", fetchErr);
        return res.status(400).json({
          success: false,
          message: `Validation Error: ${fetchErr.message}`,
        });
      }
    }

    // Fetch department for each test from medical_db
    const updatedTests = await Promise.all(
      tests.map(async (test) => {
        // test.testId is expected from frontend
        if (test.testId) {
          try {
            // Verify testId format before querying
            const mongoose = require("mongoose");
            if (mongoose.Types.ObjectId.isValid(test.testId)) {
              const testDoc = await Test.findById(test.testId);
              if (testDoc) {
                return {
                  ...test,
                  department: testDoc.department || "General", // Default if missing
                };
              }
            }
          } catch (err) {
            console.error(
              `Error fetching department for test ${test.testId}:`,
              err,
            );
            // Continue without department if checking fails
          }
        }
        return test;
      }),
    );

    // Generate Receipt Number
    const receiptSeq = await Counter.getNextSequence("receiptNo");
    const receiptNo = `INV-${receiptSeq.toString().padStart(3, "0")}`;

    // Generate Sample ID
    const sampleSeq = await Counter.getNextSequence("sampleId");
    const namePrefix = (patientName || "UNK")
      .replace(/[^a-zA-Z]/g, "")
      .substring(0, 3)
      .toUpperCase()
      .padEnd(3, "X");
    const sampleId = `${namePrefix}${sampleSeq.toString().padStart(4, "0")}`;

    const newBookingData = {
      patientId,
      patientType: modelName,
      uhid,
      patientName,
      tests: updatedTests,
      totalAmount,
      receiptNo,
      sampleId,
      collectorName,
      referringDoctor,
      status: "Pending",
      tatTimestamps: {
        orderCreatedAt: new Date(),
      },
      paymentStatus: paymentMode === "cash" ? "Paid" : "Pending",
      paymentMode,
    };

    console.log("Saving new booking:", JSON.stringify(newBookingData, null, 2));

    const newBooking = new Booking(newBookingData);
    await newBooking.save();

    // Log Booking/Payment
    const logActivity = require("../utils/logActivity");
    logActivity({
      actorId: req.user ? req.user._id : patientId, // Collector or User
      actorName: req.user ? req.user.name : collectorName || "Unknown",
      actorType: req.user ? req.user.role || "staff" : "system",
      action: "BOOKING_CREATE",
      targetId: newBooking._id,
      targetType: "Booking",
      metadata: {
        amount: totalAmount,
        paymentMode,
        sampleId,
        patientName,
      },
    });

    res.status(201).json({
      success: true,
      message: "Booking confirmed and saved",
      bookingId: newBooking._id,
      receiptNo,
      sampleId,
      booking: newBooking,
    });
  } catch (error) {
    console.error("Booking Confirm Error Stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Booking failed due to server error. Check logs.",
      error: error.message,
    });
  }
});

/**
 * GET /api/lab/bookings/collecotr
 * Fetch all bookings (receipts) created by a specific collector
 * Query Params: ?name=CollectorName
 */
router.get("/bookings/collector", async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Collector name required" });
    }

    // Find bookings where collectorName matches (case-insensitive partially or exact)
    // For now using exact match as stored
    const bookings = await Booking.find({ collectorName: name }).sort({
      createdAt: -1,
    });

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error("Error fetching collector bookings:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch bookings" });
  }
});

/**
 * GET /api/lab/pending
 * Fetch pending bookings filtered by department (optional)
 * Query Params: ?department=Hematology
 */
router.get("/pending", async (req, res) => {
  try {
    const { department, all_active, tracking_board, collectorName } = req.query;
    let query = {};

    if (collectorName) {
      query.collectorName = collectorName;
    }

    // Pending Reports page needs to hide those with PDFs already uploaded
    if (tracking_board !== "true") {
      query.reportUrl = null; 
    }

    if (all_active === "true" || tracking_board === "true") {
      query.status = {
        $in: [
          "Pending",
          "Sample Collected",
          "In Transit",
          "Received by Lab",
          "Processing",
          "Awaiting Validation",
          "Awaiting Sign-off",
          "Result Released",
          "Redraw Required"
        ],
      };
    } else {
      query.status = { $in: ["Pending", "Sample Collected", "Processing"] };
    }

    // If department is provided, filter bookings that have at least one test in that department
    // This requires populating tests.testId to access department

    // First, find all bookings matching status
    let bookings = await Booking.find(query)
      .populate("patientId", "name age gender uhid phone") // distinct patient models might be tricky, referring to refPath
      // Note: populate("patientId") works if refPath is correctly set in schema, which it is
      .sort({ createdAt: 1 }); // Oldest first

    // Filter by department in memory
    if (department && department !== "All" && department !== "all") {
      const targetDept = String(department).toLowerCase().trim();
      console.log(`Filtering for department: "${targetDept}"`);

      bookings = bookings.filter((booking) => {
        try {
          if (!booking.tests || !Array.isArray(booking.tests)) return false;

          return booking.tests.some((t) => {
            if (!t || !t.department) return false;
            return t.department.toLowerCase() === targetDept;
          });
        } catch (err) {
          console.error(`Error filtering booking ${booking._id}:`, err);
          return false;
        }
      });
    }

    console.log(`Returning ${bookings.length} bookings after filter`);
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error("Error fetching pending bookings:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch pending bookings" });
  }
});

/**
 * POST /api/lab/upload-report/:bookingId
 * Upload PDF report for a booking
 */
router.post(
  "/upload-report/:bookingId",
  upload.single("report"),
  async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { uploadedBy } = req.body; // Lab Employee ID passed from frontend

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No PDF file uploaded" });
      }

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        // Clean up temp file
        fs.unlinkSync(req.file.path);
        return res
          .status(404)
          .json({ success: false, message: "Booking not found" });
      }

      // Read file buffer and upload to Cloudflare R2
      const fileBuffer = fs.readFileSync(req.file.path);
      const reportKey = `reports/${bookingId}/${Date.now()}-${req.file.filename}`;

      await uploadToR2(fileBuffer, reportKey, "application/pdf");

      // Delete the temporary local file
      fs.unlinkSync(req.file.path);

      // Store R2 key and public URL in booking
      booking.reportKey = reportKey;
      booking.reportUrl = getPublicPdfUrl(reportKey);
      booking.reportUploadedAt = new Date();
      booking.status = "Awaiting Sign-off"; // Needs Doctor Verification before Release

      if (uploadedBy) {
        booking.reportUploadedBy = uploadedBy;
      }

      await booking.save();

      // Log Activity
      const logActivity = require("../utils/logActivity");
      await logActivity({
        actorId: req.body.uploadedBy || req.user?._id || "system", // Fallback if uploadedBy not sentinel
        actorName: req.user?.name || "Lab Staff",
        actorType: "lab_employee", // Usually lab staff uploads
        action: "UPLOAD_REPORT",
        targetId: booking._id,
        targetType: "Booking",
        metadata: { reportKey, patientId: booking.patientId },
      });

      res.status(200).json({
        success: true,
        message: "Report uploaded successfully",
        reportUrl: booking.reportUrl,
      });
    } catch (error) {
      console.error("Report upload failed:", error);
      // Clean up temp file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ success: false, message: "Report upload failed", error: error.message, stack: error.stack });
    }
  },
);

/**
 * GET /api/lab/booking/by-sample/:sampleId
 * Look up a booking by its sampleId (used by barcode scanner on scan page)
 * Must be declared BEFORE /booking/:id to prevent Express treating "by-sample" as an ID
 */
router.get("/booking/by-sample/:sampleId", async (req, res) => {
  try {
    const { sampleId } = req.params;
    const booking = await Booking.findOne({
      sampleId: { $regex: new RegExp(`^${sampleId.trim()}$`, "i") },
    }).populate("patientId", "name age gender uhid phone");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking found with sample ID: ${sampleId}`,
      });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    console.error("Error fetching booking by sampleId:", error);
    res.status(500).json({ success: false, message: "Failed to fetch booking" });
  }
});

/**
 * GET /api/lab/booking/:id
 * Fetch single booking details
 */
router.get("/booking/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("patientId");

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch booking" });
  }
});

/**
 * GET /api/lab/report-url/:bookingId
 * Get the public URL for viewing the report PDF
 */
router.get("/report-url/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Check for R2 uploads (new system)
    if (booking.reportKey) {
      const reportUrl = getPublicPdfUrl(booking.reportKey);
      return res.status(200).json({
        success: true,
        reportUrl: reportUrl,
      });
    }

    // Fallback for legacy Cloudinary uploads
    if (booking.reportUrl) {
      return res.status(200).json({
        success: true,
        reportUrl: booking.reportUrl,
      });
    }

    // No report available
    return res.status(404).json({
      success: false,
      message: "No report available for this booking",
    });
  } catch (error) {
    console.error("Error generating report URL:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate report URL" });
  }
});

const aiReviewController = require("../controller/aiReviewController");
/**
 * GET /api/lab/ai-review/:bookingId
 * Get AI summary of the test report
 */
router.get("/ai-review/:bookingId", aiReviewController.aiReview);

const ocrToPdfController = require("../controller/ocrToPdfController");
/**
 * POST /api/lab/ocr-to-pdf
 * OCR an image and return a generated PDF
 */
router.post("/ocr-to-pdf", imageUpload.single("image"), ocrToPdfController.ocrToPdf);

/**
 * GET /api/lab/prescriptions/:uhid
 * Fetch all medications/consultations for a patient by UHID
 */
router.get("/prescriptions/:uhid", async (req, res) => {
  try {
    const { uhid } = req.params;
    const bookings = await Booking.find({
      uhid: uhid,
      medications: { $exists: true, $not: { $size: 0 } },
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, prescriptions: bookings });
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch prescriptions" });
  }
});

/**
 * GET /api/lab/patient-reports/:uhid
 * Fetch all reports/bookings for a patient by UHID with current status
 */
router.get("/patient-reports/:uhid", async (req, res) => {
  try {
    const { uhid } = req.params;
    const reports = await Booking.find({ uhid: uhid }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, reports });
  } catch (error) {
    console.error("Error fetching patient reports:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch patient reports" });
  }
});

/**
 * GET /api/lab/patient-profile/:identifier
 * Fetch full patient profile from generalpublicpatients, studentpatients, or employeepatients
 * identifier can be UHID or Aadhaar
 */
router.get("/patient-profile/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    const cleanId = identifier.replace(/\s/g, "");

    const GeneralPublicPatient = require("../models/genernalPublic");
    const StudentPatient = require("../models/student");
    const PatientEmployee = require("../models/PatientEmployee");

    let patient = null;
    let patientType = "Patient";

    // Try to find by UHID first (numeric)
    const isLikelyUHID = /^\d+$/.test(cleanId);

    if (isLikelyUHID) {
      patient = await GeneralPublicPatient.findOne({ uhid: cleanId });
      if (!patient) {
        patient = await StudentPatient.findOne({ uhid: cleanId });
        patientType = "Student";
      }
      if (!patient) {
        patient = await PatientEmployee.findOne({ uhid: cleanId });
        patientType = "Employee";
      }
    }

    // If not found by UHID, try Aadhaar
    if (!patient) {
      patient = await GeneralPublicPatient.findOne({ aadharNumber: cleanId });
      patientType = "Patient";
      if (!patient) {
        patient = await StudentPatient.findOne({ aadharNumber: cleanId });
        patientType = "Student";
      }
      if (!patient) {
        patient = await PatientEmployee.findOne({ aadharNumber: cleanId });
        patientType = "Employee";
      }
    }

    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    res.status(200).json({
      success: true,
      patientType,
      patient: patient.toObject(),
    });
  } catch (error) {
    console.error("Error fetching patient profile:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch patient profile" });
  }
});

const labReportController = require("../controller/labReportController");

/**
 * POST /api/lab/save-results
 * Save simulated/manual results to LIS DB
 */
router.post("/save-results", labReportController.saveTestResult);

/**
 * POST /api/lab/generate-report
 * Trigger generation of PDF report from LIS data
 */
router.post("/generate-report", labReportController.generateReport);

/**
 * GET /api/lab/my-uploads/:employeeId
 * Fetch reports uploaded/generated by a specific employee
 */
router.get("/my-uploads/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;

    const reports = await Booking.find({ reportUploadedBy: employeeId })
      .populate("patientId", "name age gender uhid")
      .sort({ reportUploadedAt: -1 });

    res.status(200).json({ success: true, reports });
  } catch (error) {
    console.error("Error fetching my uploads:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch uploads" });
  }
});

/**
 * PATCH /api/lab/booking/:id/status
 * Update booking status and stamp the corresponding TAT timestamp
 */
router.patch("/booking/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Update status
    booking.status = status;

    // Stamp TAT and handle flags based on status
    const now = new Date();
    if (!booking.tatTimestamps) booking.tatTimestamps = {};

    switch (status) {
      case "Sample Collected":
        booking.tatTimestamps.sampleCollectedAt = now;
        break;
      case "In Transit":
        booking.tatTimestamps.transportStartedAt = now;
        break;
      case "Received by Lab":
        booking.tatTimestamps.labReceivedAt = now;
        break;
      case "Processing":
        booking.tatTimestamps.analysisStartedAt = now;
        break;
      case "Awaiting Validation":
        booking.tatTimestamps.analysisCompletedAt = now;
        break;
      case "Result Released":
        booking.tatTimestamps.resultReleasedAt = now;
        booking.tatTimestamps.doctorSignedOffAt = now;
        // Also stamp verification if skipping validation step explicitly
        if (!booking.tatTimestamps.resultVerifiedAt) {
          booking.tatTimestamps.resultVerifiedAt = now;
        }
        break;
      case "Awaiting Sign-off":
        booking.tatTimestamps.analysisCompletedAt = now;
        break;
      case "Completed":
        booking.tatTimestamps.doctorSignedOffAt = now;
        booking.tatTimestamps.archivedAt = now;
        break;
      case "Redraw Required":
        booking.flags.redrawRequested = true;
        booking.flags.redrawReason = remarks || "Sample rejected";
        booking.tatTimestamps = {
          ...booking.tatTimestamps,
          // reset relevant timestamps if needed, or just track the failure
        };
        break;
    }

    // Handle manual review flag
    if (req.body.requiresManualReview !== undefined) {
      booking.flags.requiresManualReview = req.body.requiresManualReview;
    }

    // Handle Critical Value Acknowledgment
    if (req.body.acknowledgeCritical) {
      booking.flags.criticalValueAcknowledgedAt = new Date();
      // We could also log WHO acknowledged if we had user info here easily
    }

    // Handle Redraw Request (if passed explicitly alongside status or independently)
    if (req.body.redrawRequested) {
      booking.flags.redrawRequested = true;
      booking.flags.redrawReason =
        req.body.reason ||
        booking.flags.redrawReason ||
        "Redraw requested via status update";
    }

    await booking.save();

    // Log activity
    const logActivity = require("../utils/logActivity");
    await logActivity({
      actorId: req.user ? req.user._id : "system",
      actorName: req.user ? req.user.name : "System",
      actorType: req.user ? req.user.role || "system" : "system",
      action: "STATUS_UPDATE",
      targetId: booking._id,
      targetType: "Booking",
      metadata: { oldStatus: booking.status, newStatus: status },
    });

    res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      data: booking,
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: error.message,
    });
  }
});

module.exports = router;
