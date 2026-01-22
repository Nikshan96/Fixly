const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const TechnicianDocument = sequelize.define('TechnicianDocument', {
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
  document_type: {
    type: DataTypes.ENUM('id_card', 'certificate', 'police_clearance', 'license', 'other'),
    allowNull: false
  },
  document_url: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  document_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verified_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  }
}, {
  tableName: 'technician_documents',
  timestamps: true
});

module.exports = TechnicianDocument;