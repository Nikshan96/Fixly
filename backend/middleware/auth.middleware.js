const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.protect = async (req, res, next) => {
	try {
		let token;
		const authHeader = req.headers.authorization;

		if (authHeader && authHeader.startsWith('Bearer ')) {
			token = authHeader.split(' ')[1];
		}

		if (!token) {
			return res.status(401).json({
				success: false,
				message: 'Not authorized, token missing',
			});
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await User.findByPk(decoded.id, {
			attributes: { exclude: ['password'] },
		});

		if (!user) {
			return res.status(401).json({
				success: false,
				message: 'Not authorized, user not found',
			});
		}

		req.user = user;
		next();
	} catch (error) {
		return res.status(401).json({
			success: false,
			message: 'Not authorized, token invalid',
		});
	}
};

exports.authorizeRoles = (...roles) => (req, res, next) => {
	if (!req.user || !roles.includes(req.user.role)) {
		return res.status(403).json({
			success: false,
			message: 'Forbidden: insufficient permissions',
		});
	}

	next();
};
