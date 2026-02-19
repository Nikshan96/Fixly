const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const PayoutSettlement = sequelize.define('PayoutSettlement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  month_key: {
    type: DataTypes.STRING(7),
    allowNull: false,
    validate: {
      is: /^\d{4}-\d{2}$/,
    },
  },
  technician_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  total_jobs: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  gross_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  platform_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  technician_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('pending', 'settled'),
    allowNull: false,
    defaultValue: 'pending',
  },
  settled_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  settlement_reference: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  settled_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'payout_settlements',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['month_key', 'technician_id'],
    },
    {
      fields: ['month_key'],
    },
  ],
});

module.exports = PayoutSettlement;