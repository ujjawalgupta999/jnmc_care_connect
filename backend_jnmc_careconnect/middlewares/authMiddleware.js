const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Doctor = require("../models/Doctor");
const LabEmployee = require("../models/LabEmployee");
const SubAdmin = require("../models/SubAdmin");
const Token = require("../models/Token");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;
    const role = decoded.role || "user";

    if (role === "admin") {
      user = await User.findById(decoded.userId).select("-password");
      if (user) user.type = "admin";
    } else if (role === "doctor") {
      user = await Doctor.findById(decoded.userId).select("-password");
      if (user) user.type = "doctor";
    } else if (role === "lab_employee") {
      user = await LabEmployee.findById(decoded.userId).select("-password");
      if (user) user.type = "lab";
    } else if (role === "sub_admin") {
      user = await SubAdmin.findById(decoded.userId).select("-password");
      if (user) user.type = "sub_admin";
    } else {
      user = await User.findById(decoded.userId).select("-password");
    }

    if (!user) return res.status(404).json({ error: "User not found" });

    req.user = user;
    req.user.jwtid = decoded.jti;

    const storedToken = await Token.findOne({
      userId: user._id,
      tokenId: decoded.jti,
    });
    if (!storedToken || storedToken.revoked === true) {
      return res.status(401).json({
        error: "Invalid token",
      });
    }

    next();
  } catch (err) {
    console.error("JWT Error:", err.message);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    return res.status(401).json({ error: "Unauthorized" });
  }
};

// Attach methods for flexible usage
authMiddleware.protect = authMiddleware;

authMiddleware.authorize = (...roles) => {
  return (req, res, next) => {
    // req.user.type is set in authMiddleware based on role
    // user.role is from the token
    const userRole = req.user ? req.user.type || req.user.role : null;

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of: ${roles.join(", ")}`,
      });
    }
    next();
  };
};

module.exports = authMiddleware;
