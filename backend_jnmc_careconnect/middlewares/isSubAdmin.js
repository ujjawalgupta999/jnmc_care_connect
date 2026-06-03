const isSubAdmin = (req, res, next) => {
  if (!req.user || req.user.type !== "sub_admin") {
    return res.status(403).json({ error: "Access denied. Sub Admins only." });
  }
  next();
};

module.exports = isSubAdmin;
