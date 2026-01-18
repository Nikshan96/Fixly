const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    type: {
      type: DataTypes.ENUM(
        // Customer booking flow
        'welcome',
        'booking_confirmed',
        'booking_cancelled',
        'booking_rescheduled',
        'technician_assigned',
        'technician_on_the_way',
        'job_started',
        'new_review_reminder',
        // Profile & Account
        'profile_updated',
        'password_changed',
        // Jobs
        'job_created',
        'job_accepted',
        'job_in_progress',
        'job_completed',
        'job_cancelled',
        'job_reassigned',
        // Payments
        'payment_received',
        'payment_failed',
        'refund_issued',
        'payout_ready',
        // Technicians
        'technician_hired',
        'technician_activated',
        'technician_deactivated',
        'technician_unavailable',
        'support_ticket',
        // Reviews
        'new_review',
        'low_rating_alert',
        // System
        'dispute_reported',
        'system_alert'
      ),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    icon: {
      type: DataTypes.STRING(50),
      defaultValue: 'bell'
    },
    color: {
      type: DataTypes.STRING(50),
      defaultValue: 'blue'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Notification;
};