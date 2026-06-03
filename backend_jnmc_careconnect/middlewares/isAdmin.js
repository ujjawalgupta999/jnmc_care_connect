// middleware/isAdmin.js
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.type !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    next();
};

module.exports = isAdmin;