const Booking = require("../models/booking");

exports.getExecutiveStats = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch all bookings for the current day
    const dailyBookings = await Booking.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    // --- 1. Top Row Metrics ---
    const testsToday = dailyBookings.reduce(
      (acc, b) => acc + (b.tests ? b.tests.length : 0),
      0,
    );
    const pendingResults = dailyBookings.filter((b) =>
      ["Pending", "Sample Collected", "Processing"].includes(b.status),
    ).length;
    const completedCount = dailyBookings.filter(
      (b) => b.status === "Completed",
    ).length;
    const dailyRevenue = dailyBookings.reduce(
      (acc, b) => acc + (b.totalAmount || 0),
      0,
    );

    // --- 2. Hourly Testing Volume (Bar Chart) ---
    // Initialize buckets for 2-hour intervals
    const hourlyBuckets = {
      "08:00": 0,
      "10:00": 0,
      "12:00": 0,
      "14:00": 0,
      "16:00": 0,
      "18:00": 0,
    };
    dailyBookings.forEach((b) => {
      const hour = new Date(b.createdAt).getHours();
      if (hour >= 8 && hour < 10) hourlyBuckets["08:00"]++;
      else if (hour >= 10 && hour < 12) hourlyBuckets["10:00"]++;
      else if (hour >= 12 && hour < 14) hourlyBuckets["12:00"]++;
      else if (hour >= 14 && hour < 16) hourlyBuckets["14:00"]++;
      else if (hour >= 16 && hour < 18) hourlyBuckets["16:00"]++;
      else if (hour >= 18) hourlyBuckets["18:00"]++;
    });

    // --- 3. Department Split (Donut Chart) ---
    const deptMap = {};
    dailyBookings.forEach((b) => {
      if (b.tests && b.tests.length > 0) {
        b.tests.forEach((test) => {
          const dept = test.department || "General"; // Default if missing
          deptMap[dept] = (deptMap[dept] || 0) + 1;
        });
      }
    });

    const totalTests = dailyBookings.reduce(
      (acc, b) => acc + (b.tests ? b.tests.length : 0),
      0,
    );
    const departmentSplit = Object.keys(deptMap).map((dept) => ({
      department: dept,
      count: deptMap[dept],
      percentage:
        totalTests > 0 ? Math.round((deptMap[dept] / totalTests) * 100) : 0,
    }));

    // --- 4. Recent Bookings (Table) ---
    const recentBookings = await Booking.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("patientName uhid status totalAmount createdAt");

    res.status(200).json({
      success: true,
      topMetrics: {
        testsToday,
        pendingResults,
        completedCount,
        completionRate:
          dailyBookings.length > 0
            ? Math.round((completedCount / dailyBookings.length) * 100)
            : 0,
        dailyRevenue: dailyRevenue,
      },
      charts: {
        hourlyVolume: hourlyBuckets,
        departmentSplit: departmentSplit,
      },
      recentActivity: recentBookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFinancialStats = async (req, res) => {
  try {
    const { range = "week" } = req.query; // 'day', 'week', 'month'
    const today = new Date();

    // Calculate Date Range
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (range === "day") {
      // Today (already set)
    } else if (range === "week") {
      startDate.setDate(today.getDate() - 6);
    } else if (range === "month") {
      startDate.setDate(today.getDate() - 29);
    }

    // 1. Total Revenue (Lifetime)
    const allBookings = await Booking.find({ status: { $ne: "Cancelled" } });
    const totalRevenue = allBookings.reduce(
      (acc, b) => acc + (b.totalAmount || 0),
      0,
    );
    const totalBookingsCount = allBookings.length;
    const avgOrderValue =
      totalBookingsCount > 0
        ? Math.round(totalRevenue / totalBookingsCount)
        : 0;

    // 2. Revenue Trend based on Range
    const trendBookings = await Booking.find({
      createdAt: { $gte: startDate },
      status: { $ne: "Cancelled" },
    });

    let revenueData = [];

    if (range === "day") {
      // Hourly buckets for today
      const hourlyMap = {};
      for (let i = 8; i <= 20; i += 2) {
        // 8 AM to 8 PM
        hourlyMap[`${i}:00`] = 0;
      }

      trendBookings.forEach((b) => {
        const h = new Date(b.createdAt).getHours();
        // Simple mapping to nearest 2-hour bucket or just exact hour if we wanted
        // Let's stick to simple buckets for "day" view similar to main dashboard
        let bucket = `${h}:00`;
        if (h < 10)
          bucket = "08:00"; // roughly
        else if (h % 2 !== 0) bucket = `${h - 1}:00`; // round down to even

        // Better logic: Match keys exactly
        const key = h < 10 ? `0${h}:00` : `${h}:00`;
        // Actually, let's just show actual hours involved or standard business hours
      });

      // Let's just do standard daily breakdown if it's week/month, and if day, do
      // simplistic logic. For simplicity and robustness, let's reuse the logic but adapt buckets.

      // If day -> Hourly
      // If week/month -> Daily

      if (range === "day") {
        // Initialize full day hours 00-23 or business hours? Business hours 8-20
        const hours = [
          "08:00",
          "10:00",
          "12:00",
          "14:00",
          "16:00",
          "18:00",
          "20:00",
        ];
        const hourMap = {};
        hours.forEach((h) => (hourMap[h] = 0));

        trendBookings.forEach((b) => {
          let h = new Date(b.createdAt).getHours();
          if (h < 8) h = 8;
          if (h > 20) h = 20;
          if (h % 2 !== 0) h -= 1; // normalize to even
          const key = h < 10 ? `0${h}:00` : `${h}:00`;
          if (hourMap[key] !== undefined) hourMap[key] += b.totalAmount || 0;
        });

        revenueData = Object.entries(hourMap).map(([day, revenue]) => ({
          day,
          revenue,
        }));
      } else {
        // Daily buckets
        const daysCount = range === "week" ? 7 : 30;
        const dateMap = {};

        for (let i = 0; i < daysCount; i++) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const key = d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          dateMap[key] = 0;
        }

        trendBookings.forEach((b) => {
          const key = new Date(b.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          if (dateMap[key] !== undefined) dateMap[key] += b.totalAmount || 0;
        });

        revenueData = Object.entries(dateMap)
          .map(([day, revenue]) => ({ day, revenue }))
          .reverse();
      }
    } else {
      // Default logic for week/month (reusing week logic basically)
      const daysCount = range === "month" ? 30 : 7;
      const dateMap = {};

      for (let i = 0; i < daysCount; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const key = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        dateMap[key] = 0;
      }

      trendBookings.forEach((b) => {
        const key = new Date(b.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        // Find exact match?
        // Doing this loop-based initialization ensures we have 0s for empty days
        if (dateMap[key] !== undefined) dateMap[key] += b.totalAmount || 0;
      });

      revenueData = Object.entries(dateMap)
        .map(([day, revenue]) => ({ day, revenue }))
        .reverse();
    }

    // 3. Recent Transactions (Increased limit for pagination)
    const recentTransactions = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .select(
        "patientName tests totalAmount paymentStatus paymentMode createdAt uhid",
      );

    const formattedTransactions = recentTransactions.map((t) => ({
      id: t._id.toString().slice(-6).toUpperCase(), // Short ID
      patient: t.patientName,
      test: t.tests[0]?.testName || "Multiple Tests", // Show first test or generic
      amount: t.totalAmount,
      status: t.paymentStatus || "Pending",
      method: t.paymentMode || "Cash",
      date: new Date(t.createdAt).toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        avgOrderValue,
        revenueData, // Now dynamic based on range
        transactions: formattedTransactions,
      },
    });
  } catch (error) {
    console.error("Financial Stats Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
