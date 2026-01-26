const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User } = require("../models");
const { mockUser } = require("../controllers/mockData");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const hasBearer = authHeader.startsWith("Bearer ");
    const token = hasBearer ? authHeader.split(" ")[1] : null;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res.status(401).json({ success: false, message: "User not found" });
      }
      req.user = user;
      return next();
    }

    // Dev fallback keeps current frontend behavior working even without token.
    if ((process.env.NODE_ENV || "development") !== "production") {
      let user = await User.findByPk(mockUser._id);
      if (!user) {
        user = await User.create({ ...mockUser, password: await bcrypt.hash(mockUser.password, 12) });
      }
      req.user = user;
      return next();
    }

    return res.status(401).json({ success: false, message: "Not authorized" });
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (req.user && !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }
  next();
};

module.exports = { protect, requireRole };
