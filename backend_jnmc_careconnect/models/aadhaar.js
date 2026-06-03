const mongoose = require("mongoose");

// Connect to the aadhaar_db database
const aadhaarDB = mongoose.connection.useDb("aadhaar_db");

const aadhaarSchema = new mongoose.Schema(
  {
    aadhaar_no: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    address: { type: Object, default: {} },
    dob: { type: String },
    contact_number: { type: String },
  },
  { collection: "aadhaar" },
);

module.exports = aadhaarDB.model("Aadhaar", aadhaarSchema);
