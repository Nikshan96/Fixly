const { User, Service, Booking, Notification, Payment } = require('../models');
const path = require('path');
const fs = require('fs');

// ─── Get All Active Services (Public) ────────────────────────────────────────
const getServices = async (req, res) => {
  try {
    const services = await Service.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']],
    });

    return res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error('Get services error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Create Booking ───────────────────────────────────────────────────────────
const createBooking = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { service_id, booking_date, booking_time, location, description } = req.body;
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Validate required fields
    if (!service_id || !booking_date || !booking_time || !location) {
      return res.status(400).json({
        success: false,
        message: 'service_id, booking_date, booking_time, and location are required',
      });
    }

    // Check service exists and is active
    const service = await Service.findOne({
      where: { id: service_id, is_active: true },
    });

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Create booking
    const booking = await Booking.create({
      customer_id: customerId,
      service_id,
      booking_date,
      booking_time,
      location,
      description: description || null,
      photo_url: photoUrl,
      status: 'pending',
      total_amount: service.base_price,
    });

    // Create booking_confirmed notification for customer
    await Notification.create({
      user_id: customerId,
      type: 'booking_confirmed',
      title: 'Booking Confirmed',
      message: `Your booking for ${service.name} on ${booking_date} has been confirmed. We are assigning a technician.`,
      icon: 'check-circle',
      color: 'green',
      is_read: false,
    });

      const io = req.app.get('io');
      if (io) {
        io.to(`user_${customerId}`).emit('notification:new', {
          type: 'booking_confirmed',
          title: 'Booking Confirmed',
          message: `Your booking for ${service.name} on ${booking_date} has been confirmed. We are assigning a technician.`,
        });
        io.to('role_admin').emit('notification:new', {
          type: 'job_created',
          title: 'New Booking Request',
          message: `A new ${service.name} booking was created by customer #${customerId}.`,
        });
      }

    // Return booking with service info
    const fullBooking = await Booking.findByPk(booking.id, {
      include: [
        { model: Service, as: 'service', attributes: ['id', 'name', 'icon', 'base_price'] },
      ],
    });

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: fullBooking,
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Get My Bookings ──────────────────────────────────────────────────────────
const getMyBookings = async (req, res) => {
  try {
    const customerId = req.user.id;

    const bookings = await Booking.findAll({
      where: { customer_id: customerId },
      include: [
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'icon', 'base_price'],
        },
        {
          model: User,
          as: 'technician',
          attributes: ['id', 'name', 'phone', 'profile_image', 'address'],
          required: false,
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['id', 'amount', 'status', 'payment_method', 'platform_fee', 'technician_amount', 'transaction_id'],
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error('Get my bookings error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Get Customer Payment History ───────────────────────────────────────────
const getMyPaymentHistory = async (req, res) => {
  try {
    const customerId = req.user.id;

    const payments = await Payment.findAll({
      include: [
        {
          model: Booking,
          as: 'booking',
          where: { customer_id: customerId },
          attributes: ['id', 'booking_date', 'booking_time', 'status', 'location'],
          include: [
            {
              model: Service,
              as: 'service',
              attributes: ['id', 'name', 'icon'],
            },
            {
              model: User,
              as: 'technician',
              attributes: ['id', 'name', 'phone'],
              required: false,
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    // Keep one effective payment row per booking. If multiple attempts exist,
    // prefer completed over pending/failed and then the newest record.
    const priority = { completed: 3, pending: 2, refunded: 1, failed: 0 };
    const byBooking = new Map();

    payments.forEach((payment) => {
      const bookingId = payment.booking?.id;
      if (!bookingId) {
        return;
      }

      const existing = byBooking.get(bookingId);
      if (!existing) {
        byBooking.set(bookingId, payment);
        return;
      }

      const currentPriority = priority[String(payment.status || '').toLowerCase()] ?? -1;
      const existingPriority = priority[String(existing.status || '').toLowerCase()] ?? -1;
      const currentCreated = new Date(payment.created_at || 0).getTime();
      const existingCreated = new Date(existing.created_at || 0).getTime();

      if (currentPriority > existingPriority || (currentPriority === existingPriority && currentCreated > existingCreated)) {
        byBooking.set(bookingId, payment);
      }
    });

    const effectivePayments = Array.from(byBooking.values()).sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );

    return res.json({ success: true, data: effectivePayments });
  } catch (error) {
    console.error('Get customer payment history error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Cancel Booking ───────────────────────────────────────────────────────────
const cancelBooking = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { id } = req.params;

    const booking = await Booking.findOne({
      where: { id, customer_id: customerId },
      include: [{ model: Service, as: 'service', attributes: ['name'] }],
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!['pending', 'accepted'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only pending or accepted bookings can be cancelled',
      });
    }

    await booking.update({ status: 'cancelled' });

    // Notify customer
    await Notification.create({
      user_id: customerId,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: `Your booking for ${booking.service?.name} has been cancelled.`,
      icon: 'x-circle',
      color: 'red',
      is_read: false,
    });

    // Notify technician if one was assigned
    if (booking.technician_id) {
      await Notification.create({
        user_id: booking.technician_id,
        type: 'job_cancelled',
        title: 'Job Cancelled',
        message: `The booking for ${booking.service?.name} has been cancelled by the customer.`,
        icon: 'x-circle',
        color: 'red',
        is_read: false,
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${customerId}`).emit('notification:new', {
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: `Your booking for ${booking.service?.name} has been cancelled.`,
      });
      if (booking.technician_id) {
        io.to(`user_${booking.technician_id}`).emit('notification:new', {
          type: 'job_cancelled',
          title: 'Job Cancelled',
          message: `The booking for ${booking.service?.name} has been cancelled by the customer.`,
        });
      }
    }

    return res.json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Update Profile ───────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, phone } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updates = {};
    if (email && email.trim()) updates.email = email.trim().toLowerCase();
    if (phone && phone.trim()) updates.phone = phone.trim();

    if (updates.email && updates.email !== user.email) {
      const existing = await User.findOne({ where: { email: updates.email } });
      if (existing && existing.id !== user.id) {
        return res.status(409).json({ success: false, message: 'Email already in use' });
      }
    }

    // Handle profile image upload
    if (req.file) {
      if (user.profile_image) {
        const oldImagePath = path.join(__dirname, '..', user.profile_image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updates.profile_image = `/uploads/${req.file.filename}`;
    }

    await user.update(updates);

    // Notification
    await Notification.create({
      user_id: userId,
      type: 'profile_updated',
      title: 'Profile Updated',
      message: 'Your profile has been updated successfully.',
      icon: 'user',
      color: 'green',
      is_read: false,
    });

    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'reset_token', 'reset_token_expires'] },
    });

    // Update localStorage data
    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Change Password ──────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    await user.update({ password: newPassword });

    // Notification
    await Notification.create({
      user_id: userId,
      type: 'password_changed',
      title: 'Password Changed',
      message: 'Your password has been changed successfully.',
      icon: 'lock',
      color: 'orange',
      is_read: false,
    });

    return res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Get Notifications ────────────────────────────────────────────────────────
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const notifications = await Notification.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit,
    });

    return res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Mark Notification as Read ────────────────────────────────────────────────
const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: { id, user_id: userId },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await notification.update({ is_read: true });

    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Mark All Notifications as Read ──────────────────────────────────────────
const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.update(
      { is_read: true },
      { where: { user_id: userId, is_read: false } }
    );

    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getServices,
  createBooking,
  getMyBookings,
  getMyPaymentHistory,
  cancelBooking,
  updateProfile,
  changePassword,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};