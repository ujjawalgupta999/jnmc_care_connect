const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

/**
 * Get the next sequence value for a named counter
 * Uses findOneAndUpdate for atomic increment
 * @param {string} name - The counter name (e.g., 'receiptNo', 'sampleId')
 * @returns {Promise<number>} - The next sequence number
 */
counterSchema.statics.getNextSequence = async function (name) {
  const counter = await this.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return counter.seq;
};

module.exports = mongoose.model("Counter", counterSchema);
