const mongoose = require("mongoose");
const { generateUniqueUHID } = require("../utils/uhid");

const generalPublicPatientSchema = new mongoose.Schema(
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

    aadharNumber: {
      type: String,
      sparse: true,
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
    },

    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"],
      default: "Unknown"
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

    registrationDate: {
      type: Date,
      default: Date.now,
    },

    visitsCount: {
      type: Number,
      default: 0,
    },

    address: {
      type: String,
      required: true,
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
  {
    timestamps: true,
  },
);

generalPublicPatientSchema.pre("save", async function () {
  if (this.uhid) return; // do not overwrite if already set

  this.uhid = await generateUniqueUHID(this.constructor);
});

const GeneralPublicPatient = mongoose.model(
  "GeneralPublicPatient",
  generalPublicPatientSchema,
);

module.exports = GeneralPublicPatient;
