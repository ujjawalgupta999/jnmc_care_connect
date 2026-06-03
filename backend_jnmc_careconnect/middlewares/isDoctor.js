const isDoctor = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: No user found' });
        }
        
        const doctorId = req.user._id || req.user.id;
        const Doctor = require("../models/Doctor");
        const doctor = await Doctor.findById(doctorId);
        
        if (!doctor) {
            return res.status(403).json({ message: 'Access denied. Doctor not found.' });
        }
        next();
    } catch (err) {
        console.error('isDoctor error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = isDoctor;
