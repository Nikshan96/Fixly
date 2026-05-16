// backend/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { DataTypes } = require('sequelize');
const { sequelize } = require('./models');
const { User, Service } = require('./models');
const { initSocket } = require('./socket');

const app = express();
const server = http.createServer(app);
const io = initSocket(server);
app.set('io', io);
const PORT = process.env.PORT || 5000;

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error('Close the running backend process or use a different PORT in backend/.env, then restart.');
    process.exit(1);
  }

  console.error('❌ Server startup error:', error.message);
  process.exit(1);
});

// ────────────────────────────────────────────────
// Middleware
// ────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ────────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/customer', require('./routes/customer.routes'));
app.use('/api/technician', require('./routes/technician.routes'));
app.use('/api/messages', require('./routes/messages.routes'));
app.use('/api/payments', require('./routes/payment.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Fixly Admin API Running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ────────────────────────────────────────────────
// Schema migration helper
// ────────────────────────────────────────────────
const ensureUsersSchema = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const usersTable = await queryInterface.describeTable('users');

  if (!usersTable.first_login) {
    await queryInterface.addColumn('users', 'first_login', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
    console.log('✅ Added missing column: users.first_login');
  }
};

// ────────────────────────────────────────────────
// Auto-setup: seed services & create default admin
// ────────────────────────────────────────────────
const autoSetup = async () => {
  try {
    console.log('🔍 Running auto-setup...\n');

    // 1. Seed services if none exist
    const serviceCount = await Service.count();
    if (serviceCount === 0) {
      console.log('📦 Seeding initial services...');
      const services = [
        {
          name: 'Plumber',
          icon: '🔧',
          description: 'Fix leaks, pipe installations, water heater repairs and drainage issues.',
          base_price: 500,
          is_active: true
        },
        {
          name: 'Electrician',
          icon: '⚡',
          description: 'Wiring, circuit breakers, light installations and all electrical repairs.',
          base_price: 600,
          is_active: true
        },
        {
          name: 'Carpenter',
          icon: '🔨',
          description: 'Door repairs, furniture fixing, cabinet making and custom woodwork.',
          base_price: 550,
          is_active: true
        },
        {
          name: 'Cleaning',
          icon: '🧹',
          description: 'Deep home cleaning, bathroom sanitization and post-construction cleanup.',
          base_price: 400,
          is_active: true
        },
        {
          name: 'Painter',
          icon: '🎨',
          description: 'Interior and exterior painting, wall finishing and color consultation.',
          base_price: 450,
          is_active: true
        },
        {
          name: 'AC Repair',
          icon: '❄️',
          description: 'AC cleaning, gas refill, installation and full maintenance services.',
          base_price: 700,
          is_active: true
        },
      ];
      await Service.bulkCreate(services);
      console.log('✅ Services seeded with descriptions!\n');
    } else {
      // Update existing services with proper descriptions if they have generic ones
      console.log(`✅ ${serviceCount} services already exist — updating descriptions if needed...\n`);
      const descriptionUpdates = [
        {
          name: 'Plumber',
          description: 'Fix leaks, pipe installations, water heater repairs and drainage issues.'
        },
        {
          name: 'Electrician',
          description: 'Wiring, circuit breakers, light installations and all electrical repairs.'
        },
        {
          name: 'Carpenter',
          description: 'Door repairs, furniture fixing, cabinet making and custom woodwork.'
        },
        {
          name: 'Cleaning',
          description: 'Deep home cleaning, bathroom sanitization and post-construction cleanup.'
        },
        {
          name: 'Painter',
          description: 'Interior and exterior painting, wall finishing and color consultation.'
        },
        {
          name: 'AC Repair',
          description: 'AC cleaning, gas refill, installation and full maintenance services.'
        },
      ];

      for (const update of descriptionUpdates) {
        const service = await Service.findOne({ where: { name: update.name } });
        if (service) {
          // Only update if description is still the old generic placeholder
          const genericDescriptions = [
            'Plumbing services',
            'Electrical services',
            'Carpentry services',
            'Cleaning services',
            'Painting services',
            'AC repair services',
            'Professional service by verified technicians.',
          ];
          const currentDescription = typeof service.description === 'string'
            ? service.description.trim()
            : service.description;

          if (!currentDescription || genericDescriptions.includes(currentDescription)) {
            await service.update({ description: update.description });
            console.log(`  ✅ Updated description for: ${update.name}`);
          }
        }
      }
    }

    // 2. Create default admin if none exists
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      console.log('👤 Creating default admin user...');
      await User.create({
        name: 'Admin User',
        email: 'admin@fixly.com',
        // Password is hashed by the User model hook.
        password: 'Admin@123',
        phone: '9876543210',
        role: 'admin',
        is_verified: true,
        is_active: true
      });
      console.log('✅ Admin created!');
      console.log('   Email:    admin@fixly.com');
      console.log('   Password: Admin@123\n');
    } else {
      console.log('✅ Admin user already exists\n');
    }

    console.log('🎉 Auto-setup complete!\n');
  } catch (error) {
    console.error('❌ Auto-setup failed:', error.message);
  }
};

// ────────────────────────────────────────────────
// Start server
// ────────────────────────────────────────────────
sequelize.sync({ alter: process.env.DB_SYNC_ALTER === 'true' })
  .then(async () => {
    console.log('✅ Database synced successfully');
    await ensureUsersSchema();
    await autoSetup();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: ${process.env.DB_NAME || 'connected'}`);
      console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
      console.log('Press Ctrl+C to stop\n');
    });
  })
  .catch((err) => {
    console.error('❌ Failed to sync database:', err.message);
    process.exit(1);
  });

module.exports = app;

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

