function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const user = req.user; // جاي من JWT

    if (!user || !user.role) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!allowedRoles.includes(user.role.toLowerCase())) {
      return res.status(403).json({ message: "ما عندك صلاحية" });
    }

    next();
  };
}

module.exports = { requireRole };
