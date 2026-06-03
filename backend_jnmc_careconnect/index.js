require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/user");

// Import Routes
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctor");
const employeeRoutes = require("./routes/labEmployee");
const labRoutes = require("./routes/labRoutes");
const reportRoutes = require("./routes/patientReportRoutes");
const patientRoutes = require("./routes/patientRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const subAdminRoutes = require("./routes/subAdminRoutes");

const app = express();

// CORS Configuration - Allow both development and production origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://jnmccareconnect.vercel.app", // Vercel production
  process.env.FRONTEND_URL, // Additional frontend URL from env if needed
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json());

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/lab", labRoutes);

app.use("/api/reports", reportRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/sub-admin", subAdminRoutes);
app.use("/api/sub-admin", subAdminRoutes);
app.use("/api/admin/tat", require("./routes/tatRoutes")); // TAT Analytics
app.use("/api/logs", require("./routes/logRoutes")); // New Activity Logs Route
app.use("/api/settings", require("./routes/settingsRoutes")); // System Settings

// Database Connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MongoDB connected");

    // Initialize Hardcoded Admin
    const initAdmin = async () => {
      try {
        const adminExists = await User.findOne({
          email: process.env.ADMIN_EMAIL,
        });

        if (!adminExists) {
          const admin = new User({
            name: "System Admin",
            email: process.env.ADMIN_EMAIL,
            username: "admin",
            password: process.env.ADMIN_PASSWORD,
            type: "admin",
            isVerified: true,
          });
          await admin.save();
          console.log("Hardcoded Admin added to database successfully.");
        }
      } catch (error) {
        console.error("Admin initialization error:", error);
      }
    };
    initAdmin();
  })
  .catch((err) => console.log("DB Connection Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`),
);
