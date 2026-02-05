const { Op } = require('sequelize');
const { Booking, Service, User, Payment, Notification, Conversation } = require('../models');

const createNotificationIfMissing = async ({
	userId,
	type,
	title,
	message,
	icon,
	color,
	link,
	windowMinutes = 15,
}) => {
	const threshold = new Date(Date.now() - windowMinutes * 60 * 1000);
	const existing = await Notification.findOne({
		where: {
			user_id: userId,
			type,
			message,
			created_at: { [Op.gte]: threshold },
		},
		order: [['created_at', 'DESC']],
	});

	if (existing) {
		return existing;
	}

	return Notification.create({
		user_id: userId,
		type,
		title,
		message,
		icon,
		color,
		is_read: false,
		link: link || null,
	});
};

const bookingInclude = [
	{ model: User, as: 'customer', attributes: ['id', 'name', 'phone', 'address'] },
	{ model: Service, as: 'service', attributes: ['id', 'name', 'icon', 'base_price'] },
];

exports.getDashboard = async (req, res) => {
	try {
		const technicianId = req.user.id;

		const [availableJobs, activeJobs, completedJobs, pendingPayout] = await Promise.all([
			Booking.count({ where: { status: 'pending', technician_id: null } }),
			Booking.count({
				where: {
					technician_id: technicianId,
					status: { [Op.in]: ['accepted', 'in-progress'] },
				},
			}),
			Booking.count({ where: { technician_id: technicianId, status: 'completed' } }),
			Payment.sum('technician_amount', {
				where: {
					status: 'pending',
				},
				include: [
					{
						model: Booking,
						as: 'booking',
						attributes: [],
						where: { technician_id: technicianId },
						required: true,
					},
				],
			}),
		]);

		return res.json({
			success: true,
			data: {
				availableJobs,
				activeJobs,
				completedJobs,
				pendingPayout: Number(pendingPayout || 0),
			},
		});
	} catch (error) {
		console.error('Technician dashboard error:', error);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
};

exports.getAvailableJobs = async (req, res) => {
	try {
		const jobs = await Booking.findAll({
			where: {
				status: 'pending',
				technician_id: null,
			},
			include: bookingInclude,
			order: [['created_at', 'DESC']],
		});

		return res.json({ success: true, data: jobs });
	} catch (error) {
		console.error('Get technician available jobs error:', error);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
};

exports.getMyJobs = async (req, res) => {
	try {
		const jobs = await Booking.findAll({
			where: {
				technician_id: req.user.id,
				status: { [Op.in]: ['accepted', 'in-progress'] },
			},
			include: bookingInclude,
			order: [['booking_date', 'ASC'], ['booking_time', 'ASC']],
		});

		return res.json({ success: true, data: jobs });
	} catch (error) {
		console.error('Get technician jobs error:', error);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
};

exports.getCompletedJobs = async (req, res) => {
	try {
		const jobs = await Booking.findAll({
			where: {
				technician_id: req.user.id,
				status: 'completed',
			},
			include: bookingInclude,
			order: [['updated_at', 'DESC']],
		});

		return res.json({ success: true, data: jobs });
	} catch (error) {
		console.error('Get technician completed jobs error:', error);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
};

exports.getClosedJobs = async (req, res) => {
	try {
		const jobs = await Booking.findAll({
			where: {
				technician_id: req.user.id,
				status: { [Op.in]: ['cancelled'] },
			},
			include: bookingInclude,
			order: [['updated_at', 'DESC']],
		});

		return res.json({ success: true, data: jobs });
	} catch (error) {
		console.error('Get technician closed jobs error:', error);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
};

exports.getEarnings = async (req, res) => {
	try {
		const technicianId = req.user.id;
		const completedPayments = await Payment.findAll({
			where: {
				status: 'completed',
			},
			attributes: ['updated_at', 'technician_amount'],
			include: [
				{
					model: Booking,
					as: 'booking',
					attributes: ['id', 'technician_id'],
					where: { technician_id: technicianId },
					required: true,
				},
			],
			order: [['updated_at', 'DESC']],
		});

		const monthlyMap = new Map();
		let total = 0;

		for (const row of completedPayments) {
			const earned = Number(row.technician_amount || 0);
			total += earned;
			const date = new Date(row.updated_at || new Date());
			const year = date.getFullYear();
			const month = date.toLocaleString('default', { month: 'short' });
			const key = `${year}-${month}`;

			if (!monthlyMap.has(key)) {
				monthlyMap.set(key, { year, month, amount: 0 });
			}
			monthlyMap.get(key).amount += earned;
		}

		const monthly = Array.from(monthlyMap.values())
			.map((item) => ({ ...item, amount: Number(item.amount.toFixed(2)) }))
			.sort((a, b) => (a.year === b.year ? 0 : a.year - b.year));

		return res.json({
			success: true,
			data: {
				total: Number(total.toFixed(2)),
				monthly,
			},
		});
	} catch (error) {
		console.error('Technician earnings error:', error);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
};

exports.getNotifications = async (req, res) => {
	try {
		const limit = Number(req.query.limit || 20);
		const notifications = await Notification.findAll({
			where: { user_id: req.user.id },
			order: [['created_at', 'DESC']],
			limit,
		});
		return res.json({ success: true, data: notifications });
	} catch (error) {
		console.error('Technician notifications error:', error);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
};

exports.markNotificationRead = async (req, res) => {
	try {
		const notification = await Notification.findOne({
			where: { id: req.params.id, user_id: req.user.id },
		});

		if (!notification) {
			return res.status(404).json({ success: false, message: 'Notification not found' });
		}

		notification.is_read = true;
		await notification.save();
		return res.json({ success: true, data: notification });
	} catch (error) {
		console.error('Technician mark notification read error:', error);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
};

exports.markAllNotificationsRead = async (req, res) => {
	try {
		await Notification.update(
			{ is_read: true },
			{ where: { user_id: req.user.id, is_read: false } }
		);
		return res.json({ success: true, message: 'All notifications marked as read' });
	} catch (error) {
		console.error('Technician mark all notifications error:', error);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
};

exports.acceptJob = async (req, res) => {
	try {
		const booking = await Booking.findByPk(req.params.id);
		if (!booking) {
			return res.status(404).json({ success: false, message: 'Booking not found' });
		}

		if (booking.status !== 'pending' || booking.technician_id) {
			return res.status(409).json({
				success: false,
				message: 'Booking is no longer available for assignment',
			});
		}

		booking.technician_id = req.user.id;
		booking.status = 'accepted';
		await booking.save();

		const [conversation] = await Conversation.findOrCreate({
			where: { booking_id: booking.id },
			defaults: {
				booking_id: booking.id,
				customer_id: booking.customer_id,
				technician_id: req.user.id,
				is_active: true,
				last_message_at: null,
			},
		});

		if (!conversation.is_active) {
			conversation.is_active = true;
			await conversation.save();
		}

		await Notification.create({
			user_id: booking.customer_id,
			type: 'technician_assigned',
			title: 'Technician Assigned',
			message: 'A technician has accepted your booking.',
			icon: 'user-check',
			color: 'blue',
			is_read: false,
		});

		const io = req.app.get('io');
		if (io) {
			io.to(`user_${booking.customer_id}`).emit('notification:new', {
				type: 'technician_assigned',
				title: 'Technician Assigned',
				message: 'A technician has accepted your booking.',
			});
			io.to('role_admin').emit('notification:new', {
				type: 'job_accepted',
				title: 'Job Accepted',
				message: `Booking #${booking.id} was accepted by technician #${req.user.id}.`,
			});
		}

		const updated = await Booking.findByPk(booking.id, { include: bookingInclude });
		return res.json({ success: true, data: updated });
	} catch (error) {
		console.error('Technician accept booking error:', error);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
};

exports.startJob = async (req, res) => {
	try {
		const booking = await Booking.findByPk(req.params.id);
		if (!booking) {
			return res.status(404).json({ success: false, message: 'Booking not found' });
		}

		if (booking.technician_id !== req.user.id) {
			return res.status(403).json({ success: false, message: 'Forbidden' });
		}

		if (booking.status !== 'accepted') {
			return res.status(409).json({ success: false, message: 'Only accepted jobs can be started' });
		}

		booking.status = 'in-progress';
		await booking.save();

		await Notification.create({
			user_id: booking.customer_id,
			type: 'technician_on_the_way',
			title: 'Technician On The Way',
			message: 'Your technician has started working on your booking.',
			icon: 'truck',
			color: 'indigo',
			is_read: false,
		});

		const io = req.app.get('io');
		if (io) {
			io.to(`user_${booking.customer_id}`).emit('notification:new', {
				type: 'technician_on_the_way',
				title: 'Technician On The Way',
				message: 'Your technician has started working on your booking.',
			});
		}

		return res.json({ success: true, message: 'Job started successfully' });
	} catch (error) {
		console.error('Technician start booking error:', error);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
};

exports.completeJob = async (req, res) => {
	try {
		const booking = await Booking.findByPk(req.params.id);
		if (!booking) {
			return res.status(404).json({ success: false, message: 'Booking not found' });
		}

		if (booking.technician_id !== req.user.id) {
			return res.status(403).json({ success: false, message: 'Forbidden' });
		}

		if (!['accepted', 'in-progress'].includes(booking.status)) {
			return res.status(409).json({ success: false, message: 'Only active jobs can be completed' });
		}

		const existingPayment = await Payment.findOne({ where: { booking_id: booking.id } });
		let payment = existingPayment;
		if (!payment) {
			const totalAmount = Number(booking.total_amount || 0);
			const platformFee = Number((totalAmount * 0.05).toFixed(2));
			const technicianAmount = Number((totalAmount - platformFee).toFixed(2));

			payment = await Payment.create({
				booking_id: booking.id,
				amount: totalAmount,
				platform_fee: platformFee,
				technician_amount: technicianAmount,
				status: 'pending',
				payment_method: 'cash',
			});
		}

		if (payment.status === 'completed') {
			booking.status = 'completed';
			await booking.save();

			const completedMessage = `Booking #${booking.id} is completed and payment is confirmed.`;
			await createNotificationIfMissing({
				userId: booking.customer_id,
				type: 'job_completed',
				title: 'Job Completed',
				message: completedMessage,
				icon: 'check-circle',
				color: 'green',
			});

			const io = req.app.get('io');
			if (io) {
				io.to(`user_${booking.customer_id}`).emit('notification:new', {
					type: 'job_completed',
					title: 'Job Completed',
					message: completedMessage,
				});
				io.to('role_admin').emit('notification:new', {
					type: 'job_completed',
					title: 'Job Completed',
					message: `Booking #${booking.id} was marked completed by technician #${req.user.id}.`,
				});
			}

			return res.json({ success: true, message: 'Job completed successfully' });
		}

		if (booking.status !== 'in-progress') {
			booking.status = 'in-progress';
			await booking.save();
		}

		const paymentRequiredMessage = `Booking #${booking.id}: Technician marked work done. Please complete payment to finalize booking.`;
		const existingAlert = await Notification.findOne({
			where: {
				user_id: booking.customer_id,
				type: 'system_alert',
				message: paymentRequiredMessage,
				is_read: false,
			},
			order: [['created_at', 'DESC']],
		});

		if (!existingAlert) {
			await createNotificationIfMissing({
				userId: booking.customer_id,
				type: 'system_alert',
				title: 'Payment Required',
				message: paymentRequiredMessage,
				icon: 'wallet',
				color: 'blue',
				link: '/my-bookings',
				windowMinutes: 30,
			});
		}

		const io = req.app.get('io');
		if (io) {
			if (!existingAlert) {
				io.to(`user_${booking.customer_id}`).emit('notification:new', {
					type: 'system_alert',
					title: 'Payment Required',
					message: paymentRequiredMessage,
				});
			}
			io.to('role_admin').emit('notification:new', {
				type: 'system_alert',
				title: 'Payment Pending',
				message: `Booking #${booking.id} is waiting for customer payment.`,
			});
		}

		return res.json({
			success: true,
			requiresPayment: true,
			message: 'Work marked done. Waiting for customer payment to finalize completion.',
		});
	} catch (error) {
		console.error('Technician complete booking error:', error);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
};

exports.getProfile = async (req, res) => {
	try {
		const technician = await User.findByPk(req.user.id, {
			attributes: { exclude: ['password'] },
		});
		return res.json({ success: true, data: technician });
	} catch (error) {
		console.error('Technician profile error:', error);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
};

exports.updateProfile = async (req, res) => {
	try {
		const technician = await User.findByPk(req.user.id);
		if (!technician) {
			return res.status(404).json({ success: false, message: 'Technician not found' });
		}

		const allowedFields = [
			'name',
			'phone',
			'address',
			'hourly_rate',
			'experience_years',
			'bank_name',
			'account_number',
			'account_holder_name',
		];
		const updates = {};
		allowedFields.forEach((field) => {
			if (req.body[field] !== undefined) {
				updates[field] = req.body[field];
			}
		});

		await technician.update(updates);
		const updated = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
		return res.json({ success: true, data: updated });
	} catch (error) {
		console.error('Technician update profile error:', error);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
};

exports.changePassword = async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;

		if (!currentPassword || !newPassword) {
			return res.status(400).json({
				success: false,
				message: 'Current password and new password are required',
			});
		}

		if (String(newPassword).length < 6) {
			return res.status(400).json({
				success: false,
				message: 'New password must be at least 6 characters',
			});
		}

		const technician = await User.findByPk(req.user.id);
		if (!technician) {
			return res.status(404).json({ success: false, message: 'Technician not found' });
		}

		const isMatch = await technician.comparePassword(currentPassword);
		if (!isMatch) {
			return res.status(400).json({ success: false, message: 'Current password is incorrect' });
		}

		await technician.update({ password: newPassword });

		await Notification.create({
			user_id: technician.id,
			type: 'password_changed',
			title: 'Password Changed',
			message: 'Your password has been changed successfully.',
			icon: 'lock',
			color: 'orange',
			is_read: false,
		});

		return res.json({ success: true, message: 'Password changed successfully' });
	} catch (error) {
		console.error('Technician change password error:', error);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
};
