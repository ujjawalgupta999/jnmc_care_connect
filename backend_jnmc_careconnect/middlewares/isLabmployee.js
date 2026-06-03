const isLabEmployee = (req, res, next) => {
    // Check user type from your User model
    if (req.user && req.user.type === "labemployee") {
        next();
    } else {
        res.status(403).json({ 
            success: false, 
            message: "Access denied. Lab Employees only." 
        });
    }
};

module.exports = isLabEmployee; 