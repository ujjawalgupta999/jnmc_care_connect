const Booking = require("../models/booking");

/**
 * GET /api/admin/tat/stats
 * Calculate average TAT for each phase and overall performance
 */
exports.getTatStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Date filter
    const query = {
      status: { $in: ["Result Released", "Completed", "Awaiting Sign-off"] },
    };

    if (startDate && endDate) {
      query["tatTimestamps.orderCreatedAt"] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else {
      // Default to last 30 days if no date range provided
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query["tatTimestamps.orderCreatedAt"] = { $gte: thirtyDaysAgo };
    }

    const bookings = await Booking.find(query)
      .select("tatTimestamps status patientName sampleId tests")
      .lean();

    let preLabTotal = 0,
      intraLabTotal = 0,
      clinicalTotal = 0;
    let preLabCount = 0,
      intraLabCount = 0,
      clinicalCount = 0;

    const bottlenecks = {
      collection: 0,
      transport: 0,
      processing: 0,
      validation: 0,
    };

    bookings.forEach((b) => {
      const t = b.tatTimestamps || {};

      // Pre-Lab: Order -> Lab Received
      if (t.orderCreatedAt && t.labReceivedAt) {
        const diff =
          (new Date(t.labReceivedAt) - new Date(t.orderCreatedAt)) / 60000; // minutes
        preLabTotal += diff;
        preLabCount++;
        if (diff > 60) bottlenecks.transport++;
      }

      // Intra-Lab: Lab Received -> Result Released
      if (t.labReceivedAt && t.resultReleasedAt) {
        const diff =
          (new Date(t.resultReleasedAt) - new Date(t.labReceivedAt)) / 60000;
        intraLabTotal += diff;
        intraLabCount++;
        if (diff > 60) bottlenecks.processing++;
      }

      // Clinical: Result Released -> Signed Off (if signed off)
      if (t.resultReleasedAt && t.doctorSignedOffAt) {
        const diff =
          (new Date(t.doctorSignedOffAt) - new Date(t.resultReleasedAt)) /
          60000;
        clinicalTotal += diff;
        clinicalCount++;
      }
    });

    res.status(200).json({
      success: true,
      averages: {
        preLab: preLabCount ? Math.round(preLabTotal / preLabCount) : 0,
        intraLab: intraLabCount ? Math.round(intraLabTotal / intraLabCount) : 0,
        clinical: clinicalCount ? Math.round(clinicalTotal / clinicalCount) : 0,
      },
      counts: {
        total: bookings.length,
        preLab: preLabCount,
        intraLab: intraLabCount,
        clinical: clinicalCount,
      },
      bottlenecks,
    });
  } catch (error) {
    console.error("TAT Stats Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch TAT stats" });
  }
};

/**
 * GET /api/admin/tat/overdue
 * Get list of bookings that are exceeding SLA thresholds
 */
exports.getOverdueBookings = async (req, res) => {
  try {
    // Find active bookings
    const bookings = await Booking.find({
      status: {
        $nin: [
          "Completed",
          "Cancelled",
          "Result Released",
          "Awaiting Sign-off",
        ],
      },
    })
      .select("patientName uhid sampleId status tatTimestamps createdAt")
      .lean();

    const now = new Date();
    const overdue = [];

    bookings.forEach((b) => {
      const t = b.tatTimestamps || {};
      const createdAt = t.orderCreatedAt || b.createdAt;
      const elapsed = (now - new Date(createdAt)) / 60000; // minutes

      // Simple SLA logic for demo:
      // Pending > 60m = Overdue Collection
      // In Transit > 60m = Overdue Transport
      // Processing > 120m = Overdue Processing

      let reason = null;
      if (b.status === "Pending" && elapsed > 60) reason = "Delayed Collection";
      else if (
        b.status === "In Transit" &&
        (now - new Date(t.transportStartedAt || createdAt)) / 60000 > 60
      )
        reason = "Delayed Transport";
      else if (
        b.status === "Processing" &&
        (now - new Date(t.analysisStartedAt || createdAt)) / 60000 > 120
      )
        reason = "Delayed Analysis";
      else if (
        b.status === "Received by Lab" &&
        (now - new Date(t.labReceivedAt || createdAt)) / 60000 > 60
      )
        reason = "Delayed Processing Start";

      if (reason) {
        overdue.push({
          _id: b._id,
          patientName: b.patientName,
          uhid: b.uhid,
          sampleId: b.sampleId,
          status: b.status,
          elapsedMinutes: Math.round(elapsed),
          reason,
        });
      }
    });

    res.status(200).json({ success: true, overdue });
  } catch (error) {
    console.error("TAT Overdue Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch overdue bookings" });
  }
};
