const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const subAdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    department: { type: String, required: true },
    subAdminId: { type: String, required: true, unique: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    role: { type: String, default: "sub_admin" },
  },
  { timestamps: true },
);

subAdminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

subAdminSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("SubAdmin", subAdminSchema);
