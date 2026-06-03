const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ["billing", "general", "notification", "lab", "system"],
      default: "general",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Setting", settingSchema);
