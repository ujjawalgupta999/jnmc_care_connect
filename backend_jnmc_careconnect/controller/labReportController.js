const mongoose = require("mongoose");
const puppeteer = require("puppeteer");
const Booking = require("../models/booking");
const lisSchema = require("../models/LisTestResult");
const { generateHematologyHTML } = require("../utils/reportTemplate");
const { uploadToR2, getPublicPdfUrl } = require("../utils/r2Config");

// Create a separate connection to LIS DB
const lisConnection = mongoose.createConnection(
  process.env.LIS_MONGO_URI || "mongodb://127.0.0.1:27017/lis_db",
);
const LisTestResult = lisConnection.model("TestResult", lisSchema);

exports.saveTestResult = async (req, res) => {
  try {
    const { bookingId, sampleId, results, testDate, parsedAt } = req.body;

    if (!sampleId || !results) {
      return res.status(400).json({
        success: false,
        message: "Sample ID and Results are required",
      });
    }

    // Check if result already exists for this sample
    let testResult = await LisTestResult.findOne({ sampleId });

    if (testResult) {
      // Update existing
      testResult.results = results;
      testResult.testDate = testDate || new Date();
      testResult.parsedAt = parsedAt || new Date();
    } else {
      // Create new
      testResult = new LisTestResult({
        sampleId,
        patientId: req.body.uhid || "Unknown", // Optional, can be passed
        testDate: testDate || new Date(),
        results: results,
        parsedAt: parsedAt || new Date(),
        rawMessage: "Simulated via Gemini",
      });
    }

    await testResult.save();

    // Check for critical values
    let hasCriticalValue = false;
    results.forEach((r) => {
      // Simple logic: if flag is 'H' (High) or 'L' (Low) or 'A' (Abnormal)
      if (["H", "L", "A", "Panic"].includes(r.flag)) {
        hasCriticalValue = true;
      }
    });

    if (hasCriticalValue) {
      // Update booking flags
      await Booking.findByIdAndUpdate(bookingId, {
        $set: {
          "flags.isCriticalValue": true,
          status: "Awaiting Validation", // Ensure it stops for validation
        },
      });

      // Log critical value alert
      // const user = await User.findById(req.user._id); // User might not be available here depending on auth
    }

    res.status(200).json({
      success: true,
      message: "LIS results saved successfully",
      data: testResult,
      criticalAlert: hasCriticalValue,
    });
  } catch (error) {
    console.error("Error saving LIS results:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save LIS results",
      error: error.message,
    });
  }
};

exports.generateReport = async (req, res) => {
  try {
    const { bookingId, sampleId, uploadedBy } = req.body;

    if (!bookingId) {
      return res
        .status(400)
        .json({ success: false, message: "Booking ID is required" });
    }

    // 1. Fetch Booking
    const booking = await Booking.findById(bookingId).populate(
      "referringDoctor.doctorId",
    );
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Use provided sampleId or fallback to booking's sampleId
    const targetSampleId = sampleId || booking.sampleId;
    if (!targetSampleId) {
      return res.status(400).json({
        success: false,
        message: "No Sample ID associated with this booking",
      });
    }

    // 2. Fetch Results from LIS DB
    const testResult = await LisTestResult.findOne({
      sampleId: targetSampleId,
    }).sort({ testDate: -1 });

    if (!testResult) {
      return res.status(404).json({
        success: false,
        message: `No LIS results found for Sample ID: ${targetSampleId}`,
      });
    }

    // 3. Generate HTML
    const htmlContent = generateHematologyHTML(booking, testResult);

    // 4. Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    // 5. Upload to R2
    const reportKey = `reports/${bookingId}/GEN-${Date.now()}.pdf`;
    await uploadToR2(pdfBuffer, reportKey, "application/pdf");

    // 6. Update Booking
    booking.reportKey = reportKey;
    booking.reportUrl = getPublicPdfUrl(reportKey);
    booking.reportUploadedAt = new Date();
    booking.status = "Awaiting Sign-off"; // Changed from Result Released for Doctor Verification workflow
    if (!booking.tatTimestamps) booking.tatTimestamps = {};
    // Temporarily setting resultReleasedAt here? Wait, better to keep it empty until actual release.
    // Let's just not set resultReleasedAt yet, or set analysisCompletedAt instead.
    booking.tatTimestamps.analysisCompletedAt = new Date();

    // If auto-signoff is enabled or not needed, we might auto-move to Completed,
    // but for now strict TAT implies waiting for doctor.
    // However, to maintain backward compatibility if doctor sign-off isn't built yet,
    // we might need to handle this carefully.
    // Phase 4 builds the sign-off. For now, let's stick to "Result Released".
    booking.sampleId = targetSampleId; // Ensure sync
    if (uploadedBy) {
      booking.reportUploadedBy = uploadedBy;
    }

    await booking.save();

    // Log Report Generation
    const logActivity = require("../utils/logActivity");
    // We expect req.user from auth middleware, but if called internally or without auth, fallback
    const uploaderId = uploadedBy || (req.user ? req.user._id : undefined);
    // If we have uploaderId, try to resolve name/type, otherwise generic
    const uploaderName = req.user
      ? req.user.name
      : uploadedBy // Fixed typo from 'uplodedBy'
        ? "Processor"
        : "System";

    await logActivity({
      actorId: uploaderId || booking._id, // Fallback to booking/system if no user
      actorName: uploaderName,
      actorType: req.user
        ? (req.user.role || req.user.type || "lab").toLowerCase()
        : "system",
      action: "REPORT_GENERATE",
      targetId: bookingId,
      targetType: "Booking",
      metadata: { sampleId: targetSampleId, reportUrl: booking.reportUrl },
    });

    res.status(200).json({
      success: true,
      message: "Report generated and uploaded successfully",
      reportUrl: booking.reportUrl,
    });
  } catch (error) {
    console.error("Report Generation Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate report",
      error: error.message,
    });
  }
};
