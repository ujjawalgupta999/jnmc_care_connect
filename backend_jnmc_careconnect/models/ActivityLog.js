const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "actorModel",
    required: true,
  },
  actorName: { type: String, required: true }, // Cached for quick display
  actorType: {
    type: String,
    required: true,
    enum: [
      "admin",
      "sub_admin",
      "doctor",
      "lab_employee",
      "lab",
      "user",
      "patient",
      "system",
    ],
  },
  actorModel: {
    type: String,
    required: true,
    enum: ["User", "SubAdmin", "Doctor", "LabEmployee"],
  },
  action: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  targetId: { type: String }, // Can be ObjectId or string ID
  targetType: { type: String }, // 'Booking', 'Patient', 'Report', etc.
  metadata: { type: Object }, // Flexible field for extra details (IP, amount, etc.)
  createdAt: { type: Date, default: Date.now, index: true },
});

// Indexes for common queries
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ actorType: 1 });
activityLogSchema.index({ actorId: 1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
