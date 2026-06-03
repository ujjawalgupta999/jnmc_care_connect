const mongoose = require("mongoose");
const { generateUniqueUHID } = require("../utils/uhid");
const studentPatientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    uhid: {
      type: String,
      unique: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    enrollmentNumber: {
      type: String,
      required: true,
      unique: true,
    },

    facultyNumber: {
      type: String,
    },

    department: {
      type: String,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"],
      default: "Unknown"
    },

    aadharNumber: {
      type: String,
      sparse: true,
    },

    phone: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    address: {
      dist: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      pinCode: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  },
);

studentPatientSchema.pre("save", async function () {
  if (this.uhid) return;
  this.uhid = await generateUniqueUHID(this.constructor);
});

module.exports = mongoose.model("StudentPatient", studentPatientSchema);
