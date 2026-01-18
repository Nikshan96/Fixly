const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  technician_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  service_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'services',
      key: 'id'
    }
  },
  booking_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  booking_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  location: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'in-progress', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  platform_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  photo_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'bookings',
  timestamps: true
});

module.exports = Booking;