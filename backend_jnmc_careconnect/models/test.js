const mongoose = require("mongoose");

// Connect to medical_db
const medicalDB = mongoose.connection.useDb("medical_db");

const testSchema = new mongoose.Schema(
  {
    testName: { type: String, required: true },
    testCode: { type: String, required: true },
    priceINR: { type: Number, required: true },
    department: { type: String },
    sampleType: { type: String },
    turnaroundTime: { type: String },
  },
  { collection: "test" },
);

module.exports = medicalDB.model("Test", testSchema);
