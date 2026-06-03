const ActivityLog = require("../models/ActivityLog");

/**
 * Logs an activity to the database.
 * @param {Object} params - The log parameters.
 * @param {string|Object} params.actorId - The ID of the user performing the action.
 * @param {string} params.actorName - The name of the user (cached).
 * @param {string} params.actorType - The role/type of the user (admin, doctor, etc.).
 * @param {string} params.action - The action performed (LOGIN, UPDATE, etc.).
 * @param {string} [params.targetId] - The ID of the object being acted upon.
 * @param {string} [params.targetType] - The type of object (Booking, Patient, etc.).
 * @param {Object} [params.metadata] - Additional details.
 */
const logActivity = async ({
  actorId,
  actorName,
  actorType,
  action,
  targetId,
  targetType,
  metadata,
}) => {
  try {
    // Basic validation
    if (!actorId || !action || !actorType) {
      console.warn("ActivityLog: Missing required fields", {
        actorId,
        action,
        actorType,
      });
      return;
    }

    // Determine actorModel based on actorType to support dynamic refPath
    let actorModel = "User"; // Default for admin/patient
    if (actorType === "doctor") actorModel = "Doctor";
    if (actorType === "lab_employee" || actorType === "lab")
      actorModel = "LabEmployee";
    if (actorType === "sub_admin") actorModel = "SubAdmin";

    // Create log asynchronously - generally we don't await this in controllers
    // to avoid slowing down the main request
    await ActivityLog.create({
      actorId,
      actorName,
      actorType,
      actorModel,
      action,
      targetId: targetId ? String(targetId) : undefined,
      targetType,
      metadata,
    });
  } catch (error) {
    // Silently fail or just log error so we don't crash main app flow
    console.error("Failed to create activity log:", error.message);
  }
};

module.exports = logActivity;
