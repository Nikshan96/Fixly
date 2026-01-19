const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  booking_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'bookings',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_method: {
    type: DataTypes.ENUM('esewa', 'khalti', 'cash'),
    allowNull: true
  },
  platform_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  technician_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    allowNull: false,
    defaultValue: 'pending'
  },
  transaction_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'payments',
  timestamps: true
});

module.exports = Payment;