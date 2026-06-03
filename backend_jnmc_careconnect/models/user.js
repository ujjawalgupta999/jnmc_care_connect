const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    aadhar: { type: Number, required: false, unique: true, sparse: true },
    uhid: { type: Number, required: false, unique: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: "0000000000" },
    // 'type' is used by isAdmin middleware to grant access
    type: { type: String, default: "user" },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
