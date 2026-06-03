const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "onModel",
  },
  onModel: {
    type: String,
    required: true,
    enum: ["User", "Doctor", "LabEmployee", "SubAdmin"],
  },
  tokenId: { type: String, required: true },
  revoked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: "30d" },
});

module.exports = mongoose.model("Token", tokenSchema);
