const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "patientType",
    },
    patientType: {
      type: String,
      required: true,
      enum: ["GeneralPublicPatient", "StudentPatient", "PatientEmployee"],
    },
    uhid: { type: String, required: true },
    patientName: { type: String, required: true },
    tests: [
      {
        testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test" },
        testName: String,
        testCode: String,
        price: Number,
        department: String,
      },
    ],
    // Added medications array
    medications: [
      {
        name: { type: String, required: true },
        dosage: { type: String },
        instructions: { type: String },
        prescribedAt: { type: Date, default: Date.now },
      },
    ],
    totalAmount: { type: Number, required: true },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },
    paymentMode: {
      type: String,
      enum: ["cash", "online"],
      default: "cash",
    },
    receiptNo: { type: String, unique: true },
    sampleId: { type: String, unique: true },
    collectorName: { type: String },
    referringDoctor: {
      type: {
        doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
        name: { type: String },
        department: { type: String },
      },
      required: true,
    },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reportUploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reportKey: { type: String },
    reportUrl: { type: String },
    reportUploadedAt: { type: Date },
    // TAT Tracking Timestamps
    tatTimestamps: {
      orderCreatedAt: { type: Date }, // Set on booking confirm
      sampleCollectedAt: { type: Date }, // Set when phlebotomist scans
      transportStartedAt: { type: Date }, // Set when dispatched
      labReceivedAt: { type: Date }, // Set when lab receives
      analysisStartedAt: { type: Date }, // Set when machine run begins
      analysisCompletedAt: { type: Date }, // Set when results return
      resultVerifiedAt: { type: Date }, // Set when scientist validates
      resultReleasedAt: { type: Date }, // Set when report generated
      doctorSignedOffAt: { type: Date }, // Set when doctor signs
      archivedAt: { type: Date }, // Set when finalized
    },
    // New TAT Status Enum
    status: {
      type: String,
      enum: [
        "Pending",
        "Sample Collected",
        "In Transit",
        "Received by Lab",
        "Processing",
        "Awaiting Validation",
        "Result Released",
        "Awaiting Sign-off",
        "Completed",
        "Cancelled",
        "Redraw Required",
      ],
      default: "Pending",
    },
    // Operational Flags
    flags: {
      requiresManualReview: { type: Boolean, default: false },
      isCriticalValue: { type: Boolean, default: false },
      criticalValueAcknowledgedAt: { type: Date },
      redrawRequested: { type: Boolean, default: false },
      redrawReason: { type: String },
    },
  },
  { timestamps: true },
);

bookingSchema.pre("save", async function () {
  if (
    this.patientType === "StudentPatient" ||
    this.patientType === "PatientEmployee"
  ) {
    this.totalAmount = 0;
    return;
  }

  const testTotal = this.tests.reduce(
    (sum, test) => sum + (test.price || 0),
    0,
  );
  const hospitalCharges = Number(process.env.HOSPITALCHARGES || 0);
  this.totalAmount = testTotal + hospitalCharges;
});

module.exports = mongoose.model("Booking", bookingSchema);
