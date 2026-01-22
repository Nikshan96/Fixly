const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const TechnicianSupportConversation = sequelize.define('TechnicianSupportConversation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
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
  last_message_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'technician_support_conversations',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['admin_id', 'technician_id'],
    },
  ],
});

module.exports = TechnicianSupportConversation;
