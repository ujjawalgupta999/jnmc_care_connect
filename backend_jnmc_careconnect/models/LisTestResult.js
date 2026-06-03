const mongoose = require("mongoose");

// We need a specific connection for LIS DB, distinct from the main DB
// This will be established in the controller or a separate config
const resultItemSchema = new mongoose.Schema(
  {
    parameter: { type: String },
    value: { type: Number },
    unit: { type: String },
    flag: { type: String },
    refRange: { type: String },
  },
  { _id: false },
);

const testResultSchema = new mongoose.Schema({
  rawMessage: { type: String },
  messageControlId: { type: String },
  patientId: { type: String },
  sampleId: { type: String }, // This is the key link to Booking
  testDate: { type: Date },
  results: [resultItemSchema],
  parsedAt: { type: Date },
});

module.exports = testResultSchema;
