const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const TechnicianService = sequelize.define('TechnicianService', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  technician_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
  }
}, {
  tableName: 'technician_services',
  timestamps: true
});

module.exports = TechnicianService;