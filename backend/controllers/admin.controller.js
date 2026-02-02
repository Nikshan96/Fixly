const { 
  User, 
  Service, 
  Booking, 
  Review, 
  Payment, 
  TechnicianServiceArea,
  TechnicianAvailability,
  TechnicianDocument,
  Conversation,
  Message,
  Notification,
  PayoutSettlement,
  sequelize 
} = require('../models');
const { Op } = require('sequelize');
const NotificationService = require('../utils/notifications');
const { sendEmail } = require('../utils/emailService');

const toNumber = (value) => Number.parseFloat(value || 0);

const getMonthKey = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const parseMonthKey = (monthKey) => {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) {
    return null;
  }

  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number.parseInt(yearStr, 10);
  const month = Number.parseInt(monthStr, 10);
  if (!year || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
};

const getMonthRange = (monthKey) => {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) {
    return null;
  }

  const start = new Date(Date.UTC(parsed.year, parsed.month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(parsed.year, parsed.month, 0, 23, 59, 59, 999));
  return { start, end };
};

const formatMonthLabel = (monthKey) => {
  const range = getMonthRange(monthKey);
  if (!range) {
    return monthKey;
  }
  return range.start.toLocaleString('default', { month: 'short', year: 'numeric' });
};

const buildFinanceAggregation = async ({ startDate, endDate }) => {
  const payments = await Payment.findAll({
    where: {
      status: 'completed',
      created_at: {
        [Op.between]: [startDate, endDate],
      },
    },
    include: [
      {
        model: Booking,
        as: 'booking',
        attributes: ['id', 'technician_id'],
        include: [
          {
            model: User,
            as: 'technician',
            required: false,
            attributes: ['id', 'name', 'bank_name', 'account_number', 'account_holder_name'],
          },
        ],
      },
    ],
    order: [['created_at', 'ASC']],
  });

  const monthlyMap = new Map();
  const technicianMap = new Map();
  let totalGross = 0;
  let totalPlatformRevenue = 0;
  let totalTechnicianPayable = 0;

  payments.forEach((payment) => {
    const gross = toNumber(payment.amount);
    const platform = toNumber(payment.platform_fee);
    const technicianAmount = toNumber(payment.technician_amount);
    const paymentDate = payment.created_at ? new Date(payment.created_at) : new Date();
    const monthKey = getMonthKey(paymentDate);

    totalGross += gross;
    totalPlatformRevenue += platform;
    totalTechnicianPayable += technicianAmount;

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        monthKey,
        gross: 0,
        platformRevenue: 0,
        technicianPayable: 0,
        completedPayments: 0,
      });
    }

    const monthRow = monthlyMap.get(monthKey);
    monthRow.gross += gross;
    monthRow.platformRevenue += platform;
    monthRow.technicianPayable += technicianAmount;
    monthRow.completedPayments += 1;

    const technician = payment.booking?.technician;
    if (technician && technician.id) {
      const techKey = `${monthKey}:${technician.id}`;
      if (!technicianMap.has(techKey)) {
        technicianMap.set(techKey, {
          monthKey,
          technicianId: technician.id,
          technicianName: technician.name,
          bankName: technician.bank_name || null,
          accountNumber: technician.account_number || null,
          accountHolderName: technician.account_holder_name || null,
          totalJobs: 0,
          gross: 0,
          platformFee: 0,
          technicianAmount: 0,
        });
      }

      const techRow = technicianMap.get(techKey);
      techRow.totalJobs += 1;
      techRow.gross += gross;
      techRow.platformFee += platform;
      techRow.technicianAmount += technicianAmount;
    }
  });

  const monthly = Array.from(monthlyMap.values())
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .map((row) => ({
      monthKey: row.monthKey,
      label: formatMonthLabel(row.monthKey),
      gross: Number(row.gross.toFixed(2)),
      platformRevenue: Number(row.platformRevenue.toFixed(2)),
      technicianPayable: Number(row.technicianPayable.toFixed(2)),
      completedPayments: row.completedPayments,
    }));

  const technicianPayables = Array.from(technicianMap.values())
    .sort((a, b) => {
      const monthCmp = a.monthKey.localeCompare(b.monthKey);
      if (monthCmp !== 0) {
        return monthCmp;
      }
      return a.technicianName.localeCompare(b.technicianName);
    })
    .map((row) => ({
      ...row,
      gross: Number(row.gross.toFixed(2)),
      platformFee: Number(row.platformFee.toFixed(2)),
      technicianAmount: Number(row.technicianAmount.toFixed(2)),
    }));

  return {
    summary: {
      totalGross: Number(totalGross.toFixed(2)),
      totalPlatformRevenue: Number(totalPlatformRevenue.toFixed(2)),
      totalTechnicianPayable: Number(totalTechnicianPayable.toFixed(2)),
      completedPayments: payments.length,
    },
    monthly,
    technicianPayables,
  };
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalJobs = await Booking.count();
    const activeTechnicians = await User.count({ 
      where: { role: 'technician', is_active: true } 
    });
    const pendingJobs = await Booking.count({ 
      where: { status: 'pending' } 
    });
    
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const monthlyRevenue = await Payment.sum('platform_fee', {
      where: {
        status: 'completed',
        created_at: {
          [Op.gte]: currentMonth
        }
      }
    }) || 0;

    res.json({
      success: true,
      data: {
        totalJobs,
        activeTechnicians,
        pendingJobs,
        monthlyRevenue: parseFloat(monthlyRevenue).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching statistics',
      error: error.message 
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    
    const whereClause = {};
    if (role) whereClause.role = role;
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;
    
    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching users',
      error: error.message 
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user',
      error: error.message 
    });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, address, is_active, role } = req.body;
    
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    await user.update({
      name: name || user.name,
      email: email || user.email,
      phone: phone || user.phone,
      address: address || user.address,
      is_active: is_active !== undefined ? is_active : user.is_active,
      role: role || user.role
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating user',
      error: error.message 
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting user',
      error: error.message 
    });
  }
};

// @desc    Get all technicians
// @route   GET /api/admin/technicians
exports.getAllTechnicians = async (req, res) => {
  try {
    const technicians = await User.findAll({
      where: { role: 'technician' },
      include: [
        {
          model: Service,
          as: 'services',
          attributes: ['id', 'name', 'icon'],
          through: { attributes: [] }
        },
        {
          model: TechnicianServiceArea,
          as: 'serviceAreas',
          attributes: ['id', 'city', 'district', 'postal_code']
        },
        {
          model: TechnicianAvailability,
          as: 'availability',
          attributes: ['id', 'day_of_week', 'start_time', 'end_time', 'is_available']
        },
        {
          model: TechnicianDocument,
          as: 'documents',
          attributes: ['id', 'document_type', 'verified', 'expiry_date']
        }
      ],
      attributes: { exclude: ['password'] },
      order: [['rating', 'DESC']]
    });

    res.json({
      success: true,
      data: technicians
    });
  } catch (error) {
    console.error('Get technicians error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching technicians',
      error: error.message
    });
  }
};

// @desc    Get technicians by service
// @route   GET /api/admin/technicians/service/:serviceId
exports.getTechniciansByService = async (req, res) => {
  try {
    const technicians = await User.findAll({
      where: { role: 'technician', is_active: true },
      include: [
        {
          model: Service,
          as: 'services',
          where: { id: req.params.serviceId },
          attributes: ['id', 'name', 'icon'],
          through: { attributes: [] }
        }
      ],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: technicians
    });
  } catch (error) {
    console.error('Get technicians by service error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching technicians',
      error: error.message 
    });
  }
};

// @desc    Create new technician (UPDATED with notification)
// @route   POST /api/admin/technicians
exports.createTechnician = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      phone, 
      address, 
      bank_name, 
      account_number, 
      account_holder_name 
    } = req.body;

    let services = [];
    if (Array.isArray(req.body.services)) {
      services = req.body.services;
    } else if (typeof req.body.services === 'string' && req.body.services.trim()) {
      try {
        services = JSON.parse(req.body.services);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid services format'
        });
      }
    }

    const normalizedServices = Array.isArray(services)
      ? services
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0)
      : [];

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and phone are required'
      });
    }

    if (normalizedServices.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one service is required'
      });
    }

    const adminId = req.user.id; // Admin who is creating

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }

    let profile_image = null;
    if (req.file) {
      profile_image = `/uploads/${req.file.filename}`;
    }

    const temporaryPassword = password || 'Technician@123';

    const technician = await User.create({
      name,
      email,
      password: temporaryPassword,
      phone,
      address,
      role: 'technician',
      first_login: false,
      is_verified: true,
      is_active: true,
      profile_image,
      bank_name,
      account_number,
      account_holder_name
    });

    try {
      const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`;

      await sendEmail({
        to: email,
        subject: 'Welcome to Fixly - Your Technician Account Details',
        html: `
          <p>Dear ${name},</p>
          <p>You have been registered as a technician on Fixly!</p>
          <p><strong>Login Details:</strong><br />
          Email: ${email}<br />
          Password: ${temporaryPassword}</p>
          <p>You can change your password anytime from your profile page.</p>
          <p>Login here: <a href="${loginUrl}">${loginUrl}</a></p>
          <p>Best regards,<br />
          Fixly Admin Team</p>
        `,
        text: `Dear ${name},\n\nYou have been registered as a technician on Fixly!\n\nLogin Details:\nEmail: ${email}\nPassword: ${temporaryPassword}\n\nYou can change your password anytime from your profile page.\n\nLogin here: ${loginUrl}\n\nBest regards,\nFixly Admin Team`
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError.message);
    }

    if (normalizedServices.length > 0) {
      await technician.setServices(normalizedServices);
    }

    // 🔔 Notify admin that a new technician was hired
    const hireNotification = await NotificationService.technicianHired(adminId, name);

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${adminId}`).emit('notification:new', {
        id: hireNotification?.id,
        type: 'technician_hired',
        title: hireNotification?.title || 'New Technician Hired',
        message: hireNotification?.message || `${name} has been successfully added to the team`,
        created_at: hireNotification?.created_at || new Date().toISOString(),
      });
      io.to('role_admin').emit('notification:new', {
        id: hireNotification?.id,
        type: 'technician_hired',
        title: hireNotification?.title || 'New Technician Hired',
        message: hireNotification?.message || `${name} has been successfully added to the team`,
        created_at: hireNotification?.created_at || new Date().toISOString(),
      });
    }

    const technicianWithServices = await User.findByPk(technician.id, {
      include: [{
        model: Service,
        as: 'services',
        attributes: ['id', 'name', 'icon'],
        through: { attributes: [] }
      }],
      attributes: { exclude: ['password'] }
    });

    res.status(201).json({
      success: true,
      message: 'Technician created successfully',
      data: technicianWithServices
    });
  } catch (error) {
    console.error('❌ Create technician error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating technician',
      error: error.message
    });
  }
};

// @desc    Update technician status
// @route   PUT /api/admin/technicians/:id/status
exports.updateTechnicianStatus = async (req, res) => {
  try {
    const { is_active } = req.body;
    const adminId = req.user.id;
    
    const technician = await User.findOne({
      where: { id: req.params.id, role: 'technician' }
    });

    if (!technician) {
      return res.status(404).json({ 
        success: false, 
        message: 'Technician not found' 
      });
    }

    await technician.update({ is_active });

    // Send notification to admin
    if (is_active) {
      await NotificationService.technicianActivated(adminId, technician.name);
    } else {
      await NotificationService.technicianDeactivated(adminId, technician.name);
    }

    res.json({
      success: true,
      message: 'Technician status updated successfully',
      data: technician
    });
  } catch (error) {
    console.error('Update technician status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating technician status',
      error: error.message 
    });
  }
};

// ────────────────────────────────────────────────
// BOOKINGS/JOBS MANAGEMENT
// ────────────────────────────────────────────────

// @desc    Get all bookings
// @route   GET /api/admin/bookings
exports.getAllBookings = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (typeof search === 'string' && search.trim()) {
      const searchText = search.trim();
      const likeOperator = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
      whereClause[Op.or] = [
        { location: { [likeOperator]: `%${searchText}%` } },
      ];
    }

    const pageNumber = Number.parseInt(page, 10) || 1;
    const pageSize = Number.parseInt(limit, 10) || 10;
    const offset = (pageNumber - 1) * pageSize;

    const [count, bookingRows] = await Promise.all([
      Booking.count({ where: whereClause }),
      Booking.findAll({
        where: whereClause,
        limit: pageSize,
        offset,
        order: [['createdAt', 'DESC']],
      }),
    ]);

    const bookings = bookingRows.map((row) => row.toJSON());
    const customerIds = [...new Set(bookings.map((booking) => booking.customer_id).filter(Boolean))];
    const technicianIds = [...new Set(bookings.map((booking) => booking.technician_id).filter(Boolean))];
    const serviceIds = [...new Set(bookings.map((booking) => booking.service_id).filter(Boolean))];

    const [customers, technicians, services] = await Promise.all([
      customerIds.length
        ? User.findAll({ where: { id: customerIds }, attributes: ['id', 'name', 'email', 'phone'] })
        : [],
      technicianIds.length
        ? User.findAll({ where: { id: technicianIds }, attributes: ['id', 'name', 'email', 'phone'] })
        : [],
      serviceIds.length
        ? Service.findAll({ where: { id: serviceIds }, attributes: ['id', 'name', 'icon', 'base_price'] })
        : [],
    ]);

    const customerMap = new Map(customers.map((user) => [user.id, user.toJSON()]));
    const technicianMap = new Map(technicians.map((user) => [user.id, user.toJSON()]));
    const serviceMap = new Map(services.map((service) => [service.id, service.toJSON()]));

    const rows = bookings.map((booking) => ({
      ...booking,
      customer: customerMap.get(booking.customer_id) || null,
      technician: technicianMap.get(booking.technician_id) || null,
      service: serviceMap.get(booking.service_id) || null,
    }));

    res.json({
      success: true,
      data: {
        bookings: rows,
        pagination: {
          total: count,
          page: pageNumber,
          limit: pageSize,
          totalPages: Math.ceil(count / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

// @desc    Get booking by ID
// @route   GET /api/admin/bookings/:id
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: User, as: 'customer', attributes: ['id', 'name', 'email', 'phone', 'address'] },
        { model: User, as: 'technician', attributes: ['id', 'name', 'email', 'phone'] },
        { model: Service, as: 'service', attributes: ['id', 'name', 'icon', 'base_price'] },
        { model: Payment, attributes: ['id', 'amount', 'status', 'payment_method'] }
      ],
    });

    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching booking',
      error: error.message 
    });
  }
};

// @desc    Update booking status
// @route   PUT /api/admin/bookings/:id/status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: User, as: 'customer' },
        { model: User, as: 'technician' }
      ]
    });

    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    const normalizeStatus = (s) => String(s || '').toLowerCase().replace('_', '-').trim();
    const normalizedStatus = normalizeStatus(status);
    const oldStatus = normalizeStatus(booking.status);
    await booking.update({ status: normalizedStatus });

    // Send notifications based on status change
    if (normalizedStatus === 'completed' && oldStatus !== 'completed') {
      await NotificationService.jobCompleted(booking.customer_id, booking.id, booking.technician?.name || 'Technician');
    } else if (normalizedStatus === 'in-progress' && oldStatus !== 'in-progress') {
      await NotificationService.jobInProgress(booking.customer_id, booking.id, booking.technician?.name || 'Technician');
    } else if (normalizedStatus === 'cancelled' && oldStatus !== 'cancelled') {
      await NotificationService.jobCancelled(booking.customer_id, booking.id, 'Admin cancelled job');
    }

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating booking status',
      error: error.message 
    });
  }
};

// @desc    Update booking (assign/reassign technician)
// @route   PUT /api/admin/bookings/:id
exports.updateBooking = async (req, res) => {
  try {
    const { technician_id, notes, scheduled_date } = req.body;
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: Service, as: 'service', attributes: ['id', 'name'] },
      ],
    });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    const previousTechnicianId = booking.technician_id;
    const isNewAssignment = technician_id && technician_id !== previousTechnicianId;
    // Build update payload
    const updateData = {
      notes: notes || booking.notes,
      scheduled_date: scheduled_date || booking.scheduled_date,
    };
    if (technician_id) {
      updateData.technician_id = technician_id;
      // Auto-advance status to accepted when a technician is assigned
      if (booking.status === 'pending') {
        updateData.status = 'accepted';
      }
    }
    await booking.update(updateData);
    // Send notifications only when technician changes
    if (isNewAssignment) {
      const serviceName = booking.service?.name || 'service';
      const io = req.app.get('io');
      // Notify the customer
      await Notification.create({
        user_id: booking.customer_id,
        type: 'technician_assigned',
        title: 'Technician Assigned ✓',
        message: `A technician has been assigned to your ${serviceName} booking. They will contact you before arrival.`,
        icon: 'user-check',
        color: 'blue',
        is_read: false,
      });
      if (io) {
        io.to(`user_${booking.customer_id}`).emit('notification:new', {
          type: 'technician_assigned',
          title: 'Technician Assigned',
          message: `A technician has been assigned to your ${serviceName} booking.`,
        });
      }
      // Notify the newly assigned technician
      await Notification.create({
        user_id: technician_id,
        type: 'job_accepted',
        title: 'New Job Assigned',
        message: `You have been assigned a new ${serviceName} job. Please review the booking details and contact the customer.`,
        icon: 'briefcase',
        color: 'green',
        is_read: false,
      });
      if (io) {
        io.to(`user_${technician_id}`).emit('notification:new', {
          type: 'job_accepted',
          title: 'New Job Assigned',
          message: `You have been assigned a new ${serviceName} job.`,
        });
      }
      // If reassignment — also notify the previous technician their job was taken
      if (previousTechnicianId) {
        await Notification.create({
          user_id: previousTechnicianId,
          type: 'job_reassigned',
          title: 'Job Reassigned',
          message: `The ${serviceName} job has been reassigned to another technician by the admin.`,
          icon: 'alert-circle',
          color: 'orange',
          is_read: false,
        });
        if (io) {
          io.to(`user_${previousTechnicianId}`).emit('notification:new', {
            type: 'job_reassigned',
            title: 'Job Reassigned',
            message: `The ${serviceName} job has been reassigned by admin.`,
          });
        }
      }
    }
    res.json({
      success: true,
      message: technician_id
        ? previousTechnicianId
          ? 'Technician reassigned successfully'
          : 'Technician assigned successfully'
        : 'Booking updated successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking',
      error: error.message,
    });
  }
};

// @desc    Get all services
// @route   GET /api/admin/services
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.findAll({
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching services',
      error: error.message 
    });
  }
};

// @desc    Create service
// @route   POST /api/admin/services
exports.createService = async (req, res) => {
  try {
    const { name, description, base_price, icon, category } = req.body;

    const service = await Service.create({
      name,
      description,
      base_price,
      icon,
      category
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating service',
      error: error.message 
    });
  }
};

// @desc    Update service
// @route   PUT /api/admin/services/:id
exports.updateService = async (req, res) => {
  try {
    const { name, description, base_price, icon, category } = req.body;

    const service = await Service.findByPk(req.params.id);
    if (!service) {
      return res.status(404).json({ 
        success: false, 
        message: 'Service not found' 
      });
    }

    await service.update({
      name: name || service.name,
      description: description || service.description,
      base_price: base_price || service.base_price,
      icon: icon || service.icon,
      category: category || service.category
    });

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating service',
      error: error.message 
    });
  }
};

// @desc    Delete service
// @route   DELETE /api/admin/services/:id
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) {
      return res.status(404).json({ 
        success: false, 
        message: 'Service not found' 
      });
    }

    await service.destroy();

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting service',
      error: error.message 
    });
  }
};

// ────────────────────────────────────────────────
// REVENUE MANAGEMENT
// ────────────────────────────────────────────────

// @desc    Get revenue statistics
// @route   GET /api/admin/revenue
exports.getRevenueStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfAllTime = new Date(Date.UTC(2020, 0, 1, 0, 0, 0, 0));
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    const endOfNow = new Date();

    const [allTimeAgg, monthlyAgg] = await Promise.all([
      buildFinanceAggregation({ startDate: startOfAllTime, endDate: endOfNow }),
      buildFinanceAggregation({ startDate: startOfMonth, endDate: endOfNow }),
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue: allTimeAgg.summary.totalPlatformRevenue.toFixed(2),
        monthlyRevenue: monthlyAgg.summary.totalPlatformRevenue.toFixed(2),
        completedBookings: allTimeAgg.summary.completedPayments,
      }
    });
  } catch (error) {
    console.error('Get revenue stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching revenue statistics',
      error: error.message 
    });
  }
};

// @desc    Get monthly revenue
// @route   GET /api/admin/revenue/monthly
exports.getMonthlyRevenue = async (req, res) => {
  try {
    const monthsBack = Number.parseInt(req.query.months, 10) || 12;
    const endOfNow = new Date();
    const startDate = new Date();
    startDate.setUTCMonth(startDate.getUTCMonth() - (monthsBack - 1));
    startDate.setUTCDate(1);
    startDate.setUTCHours(0, 0, 0, 0);

    const aggregation = await buildFinanceAggregation({ startDate, endDate: endOfNow });

    res.json({
      success: true,
      data: aggregation.monthly,
    });
  } catch (error) {
    console.error('Get monthly revenue error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching monthly revenue',
      error: error.message 
    });
  }
};

// @desc    Get payment history
// @route   GET /api/admin/payments
exports.getPaymentHistory = async (req, res) => {
  try {
    const { status, method, page = 1, limit = 20 } = req.query;
    const whereClause = {};

    if (status) whereClause.status = status;
    if (method) whereClause.payment_method = method;

    const pageNumber = Number.parseInt(page, 10) || 1;
    const pageSize = Number.parseInt(limit, 10) || 20;
    const offset = (pageNumber - 1) * pageSize;

    const { count, rows } = await Payment.findAndCountAll({
      where: whereClause,
      limit: pageSize,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Booking,
          as: 'booking',
          attributes: ['id', 'booking_date', 'booking_time', 'status', 'total_amount'],
          include: [
            { model: Service, as: 'service', attributes: ['id', 'name', 'icon'] },
            { model: User, as: 'customer', attributes: ['id', 'name', 'email', 'phone'] },
            { model: User, as: 'technician', attributes: ['id', 'name', 'email', 'phone'], required: false },
          ],
        },
      ],
    });

    return res.json({
      success: true,
      data: {
        payments: rows,
        pagination: {
          total: count,
          page: pageNumber,
          limit: pageSize,
          totalPages: Math.ceil(count / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching payment history',
      error: error.message,
    });
  }
};

// ────────────────────────────────────────────────
// REVIEWS MANAGEMENT
// ────────────────────────────────────────────────

// @desc    Get all reviews
// @route   GET /api/admin/reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      include: [
        { model: User, as: 'customer', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'technician', attributes: ['id', 'name', 'email'] },
        { model: Booking, as: 'booking', attributes: ['id', 'status'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching reviews',
      error: error.message 
    });
  }
};

// @desc    Delete review
// @route   DELETE /api/admin/reviews/:id
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({ 
        success: false, 
        message: 'Review not found' 
      });
    }

    await review.destroy();

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting review',
      error: error.message 
    });
  }
};

// @desc    Update admin profile
// @route   PUT /api/admin/profile
exports.updateProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { name, email, phone } = req.body;

    const admin = await User.findByPk(adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const updates = {};
    if (typeof name === 'string' && name.trim()) updates.name = name.trim();
    if (typeof email === 'string' && email.trim()) updates.email = email.trim();
    if (typeof phone === 'string') updates.phone = phone.trim();
    if (req.file) updates.profile_image = `/uploads/${req.file.filename}`;

    await admin.update(updates);

    await Notification.create({
      user_id: adminId,
      type: 'profile_updated',
      title: 'Profile Updated',
      message: 'Your profile has been updated successfully.',
      icon: 'user',
      color: 'green',
      is_read: false,
    });

    const updatedAdmin = await User.findByPk(adminId, {
      attributes: { exclude: ['password'] },
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedAdmin,
    });
  } catch (error) {
    console.error('Update admin profile error:', error);
    return res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
  }
};

// @desc    Change admin password
// @route   PUT /api/admin/change-password
exports.changePassword = async (req, res) => {
  try {
    const adminId = req.user.id;
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

    const admin = await User.findByPk(adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    await admin.update({ password: newPassword });

    await Notification.create({
      user_id: adminId,
      type: 'password_changed',
      title: 'Password Changed',
      message: 'Your password has been changed successfully.',
      icon: 'lock',
      color: 'orange',
      is_read: false,
    });

    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change admin password error:', error);
    return res.status(500).json({ success: false, message: 'Error changing password', error: error.message });
  }
};

// @desc    Get admin notifications
// @route   GET /api/admin/notifications
exports.getNotifications = async (req, res) => {
  try {
    const adminId = req.user.id;
    const limit = Number.parseInt(req.query.limit, 10) || 20;

    const notifications = await Notification.findAll({
      where: { user_id: adminId },
      order: [['created_at', 'DESC']],
      limit,
    });

    return res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Get admin notifications error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching notifications', error: error.message });
  }
};

// @desc    Mark admin notification as read
// @route   PUT /api/admin/notifications/:id/read
exports.markNotificationRead = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOne({ where: { id, user_id: adminId } });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await notification.update({ is_read: true });
    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark admin notification read error:', error);
    return res.status(500).json({ success: false, message: 'Error updating notification', error: error.message });
  }
};

// @desc    Mark all admin notifications as read
// @route   PUT /api/admin/notifications/read-all
exports.markAllNotificationsRead = async (req, res) => {
  try {
    const adminId = req.user.id;
    await Notification.update(
      { is_read: true },
      { where: { user_id: adminId, is_read: false } }
    );

    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all admin notifications read error:', error);
    return res.status(500).json({ success: false, message: 'Error updating notifications', error: error.message });
  }
};

// @desc    Get unified finance aggregation for graph + payouts
// @route   GET /api/admin/finance/overview
exports.getFinanceOverview = async (req, res) => {
  try {
    const monthsBack = Number.parseInt(req.query.months, 10) || 12;
    const endOfNow = new Date();
    const startDate = new Date();
    startDate.setUTCMonth(startDate.getUTCMonth() - (monthsBack - 1));
    startDate.setUTCDate(1);
    startDate.setUTCHours(0, 0, 0, 0);

    const aggregation = await buildFinanceAggregation({ startDate, endDate: endOfNow });
    const monthKeys = aggregation.monthly.map((row) => row.monthKey);
    const settlements = monthKeys.length > 0
      ? await PayoutSettlement.findAll({
          where: {
            status: 'settled',
            month_key: { [Op.in]: monthKeys },
          },
        })
      : [];

    const settledTotalsByMonth = settlements.reduce((acc, row) => {
      const key = row.month_key;
      acc[key] = (acc[key] || 0) + toNumber(row.technician_amount);
      return acc;
    }, {});

    const monthly = aggregation.monthly.map((row) => {
      const settledAmount = Number((settledTotalsByMonth[row.monthKey] || 0).toFixed(2));
      return {
        ...row,
        settledTechnicianAmount: settledAmount,
        unsettledTechnicianAmount: Number((row.technicianPayable - settledAmount).toFixed(2)),
      };
    });

    return res.json({
      success: true,
      data: {
        summary: aggregation.summary,
        monthly,
      },
    });
  } catch (error) {
    console.error('Get finance overview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching finance overview',
      error: error.message,
    });
  }
};

// @desc    Get payout settlements for a month
// @route   GET /api/admin/payout-settlements
exports.getPayoutSettlements = async (req, res) => {
  try {
    const now = new Date();
    const defaultMonth = getMonthKey(now);
    const month = typeof req.query.month === 'string' ? req.query.month : defaultMonth;
    const range = getMonthRange(month);

    if (!range) {
      return res.status(400).json({ success: false, message: 'Invalid month format. Use YYYY-MM.' });
    }

    const aggregation = await buildFinanceAggregation({ startDate: range.start, endDate: range.end });
    const monthPayables = aggregation.technicianPayables.filter((row) => row.monthKey === month);

    const settlements = await PayoutSettlement.findAll({
      where: { month_key: month },
      include: [
        {
          model: User,
          as: 'processedBy',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
      order: [['technician_id', 'ASC']],
    });

    const settlementByTech = new Map(settlements.map((row) => [row.technician_id, row]));

    const payoutRows = monthPayables.map((row) => {
      const settlement = settlementByTech.get(row.technicianId);
      return {
        monthKey: month,
        technicianId: row.technicianId,
        technicianName: row.technicianName,
        bankName: row.bankName,
        accountNumber: row.accountNumber,
        accountHolderName: row.accountHolderName,
        totalJobs: row.totalJobs,
        gross: row.gross,
        platformFee: row.platformFee,
        technicianAmount: row.technicianAmount,
        status: settlement?.status || 'pending',
        settledAt: settlement?.settled_at || null,
        settlementReference: settlement?.settlement_reference || null,
        notes: settlement?.notes || null,
        processedBy: settlement?.processedBy || null,
      };
    });

    const totals = payoutRows.reduce((acc, row) => {
      acc.totalTechnicianPayable += row.technicianAmount;
      if (row.status === 'settled') {
        acc.totalSettled += row.technicianAmount;
      }
      return acc;
    }, { totalTechnicianPayable: 0, totalSettled: 0 });

    return res.json({
      success: true,
      data: {
        month,
        monthLabel: formatMonthLabel(month),
        totals: {
          totalTechnicianPayable: Number(totals.totalTechnicianPayable.toFixed(2)),
          totalSettled: Number(totals.totalSettled.toFixed(2)),
          totalPending: Number((totals.totalTechnicianPayable - totals.totalSettled).toFixed(2)),
        },
        technicians: payoutRows,
      },
    });
  } catch (error) {
    console.error('Get payout settlements error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching payout settlements',
      error: error.message,
    });
  }
};

// @desc    Mark technician payout as settled
// @route   POST /api/admin/payout-settlements/settle
exports.markPayoutSettled = async (req, res) => {
  try {
    const { month, technicianId, settlementReference, notes } = req.body;
    const parsedTechnicianId = Number.parseInt(technicianId, 10);

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'Valid month (YYYY-MM) is required.' });
    }

    if (!parsedTechnicianId) {
      return res.status(400).json({ success: false, message: 'Valid technicianId is required.' });
    }

    const range = getMonthRange(month);
    if (!range) {
      return res.status(400).json({ success: false, message: 'Invalid month format. Use YYYY-MM.' });
    }

    const aggregation = await buildFinanceAggregation({ startDate: range.start, endDate: range.end });
    const payable = aggregation.technicianPayables.find(
      (row) => row.monthKey === month && row.technicianId === parsedTechnicianId
    );

    if (!payable || payable.technicianAmount <= 0) {
      return res.status(404).json({ success: false, message: 'No payable amount found for this technician and month.' });
    }

    await PayoutSettlement.upsert({
      month_key: month,
      technician_id: parsedTechnicianId,
      total_jobs: payable.totalJobs,
      gross_amount: payable.gross,
      platform_fee: payable.platformFee,
      technician_amount: payable.technicianAmount,
      status: 'settled',
      settled_at: new Date(),
      settlement_reference: settlementReference || null,
      notes: notes || null,
      settled_by: req.user?.id || null,
    });

    const settlement = await PayoutSettlement.findOne({
      where: {
        month_key: month,
        technician_id: parsedTechnicianId,
      },
    });

    return res.json({
      success: true,
      message: 'Payout marked as settled successfully.',
      data: settlement,
    });
  } catch (error) {
    console.error('Mark payout settled error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error marking payout settlement',
      error: error.message,
    });
  }
};