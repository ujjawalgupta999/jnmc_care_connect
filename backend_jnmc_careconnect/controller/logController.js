const ActivityLog = require("../models/ActivityLog");

// Get paginated logs with filters
exports.getLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      actorType,
      actorName,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    // Filters
    if (action) query.action = action.toUpperCase();
    if (actorType) query.actorType = actorType;
    if (actorName) query.actorName = { $regex: actorName, $options: "i" };

    // Date Range Filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ActivityLog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get stats for dashboard widgets
exports.getLogStats = async (req, res) => {
  try {
    const stats = await ActivityLog.aggregate([
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
          lastActivity: { $max: "$createdAt" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
