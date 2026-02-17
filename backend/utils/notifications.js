const { Notification } = require('../models');

class NotificationService {
  
  /**
   * CORE FUNCTION - Create a notification in the database
   */
  static async create(userId, type, title, message, options = {}) {
    try {
      if (!userId) {
        console.error('❌ NotificationService.create: userId is required');
        return null;
      }

      const notification = await Notification.create({
        user_id: userId,
        type,
        title,
        message,
        icon: options.icon || 'bell',
        color: options.color || 'blue',
        link: options.link || null,
        is_read: false
      });

      console.log(`✅ Notification created: "${title}" for user ${userId}`);
      return notification;
    } catch (error) {
      console.error('❌ Failed to create notification:', error.message);
      return null;
    }
  }

  /**
   * PROFILE & ACCOUNT NOTIFICATIONS
   */
  
  static async profileUpdated(userId, userName) {
    return this.create(
      userId,
      'profile_updated',
      'Profile Updated',
      `Your profile has been updated successfully`,
      { icon: 'user', color: 'green' }
    );
  }

  static async passwordChanged(userId, userName) {
    return this.create(
      userId,
      'password_changed',
      'Password Changed',
      `Your password was changed successfully. If this wasn't you, contact support immediately.`,
      { icon: 'lock', color: 'orange' }
    );
  }

  /**
   * JOB NOTIFICATIONS
   */
  
  static async jobCreated(userId, jobId, customerName, serviceName) {
    return this.create(
      userId,
      'job_created',
      'New Job Created',
      `${customerName} booked ${serviceName} service (Job #${jobId})`,
      { icon: 'briefcase', color: 'blue', link: `/admin/jobs/${jobId}` }
    );
  }

  static async jobAccepted(userId, jobId, technicianName) {
    return this.create(
      userId,
      'job_accepted',
      'Job Accepted',
      `${technicianName} accepted Job #${jobId}`,
      { icon: 'check', color: 'green', link: `/admin/jobs/${jobId}` }
    );
  }

  static async jobInProgress(userId, jobId, technicianName) {
    return this.create(
      userId,
      'job_in_progress',
      'Job Started',
      `${technicianName} started working on Job #${jobId}`,
      { icon: 'briefcase', color: 'blue', link: `/admin/jobs/${jobId}` }
    );
  }

  static async jobCompleted(userId, jobId, technicianName) {
    return this.create(
      userId,
      'job_completed',
      'Job Completed',
      `${technicianName} completed Job #${jobId}`,
      { icon: 'check', color: 'green', link: `/admin/jobs/${jobId}` }
    );
  }

  static async jobCancelled(userId, jobId, reason) {
    return this.create(
      userId,
      'job_cancelled',
      'Job Cancelled',
      `Job #${jobId} was cancelled${reason ? `: ${reason}` : ''}`,
      { icon: 'x-circle', color: 'red', link: `/admin/jobs/${jobId}` }
    );
  }

  static async jobReassigned(userId, jobId, newTechnicianName) {
    return this.create(
      userId,
      'job_reassigned',
      'Job Reassigned',
      `Job #${jobId} has been reassigned to ${newTechnicianName}`,
      { icon: 'shuffle', color: 'purple', link: `/admin/jobs/${jobId}` }
    );
  }

  /**
   * TECHNICIAN NOTIFICATIONS
   */
  
  static async technicianHired(adminId, technicianName, totalTechs = null) {
    return this.create(
      adminId,
      'technician_hired',
      'New Technician Hired',
      `${technicianName} has been successfully added to the team`,
      { icon: 'user-plus', color: 'green', link: '/admin/technicians' }
    );
  }

  static async technicianActivated(userId, technicianName) {
    return this.create(
      userId,
      'technician_activated',
      'Technician Activated',
      `${technicianName} is now active and accepting jobs`,
      { icon: 'check-circle', color: 'green' }
    );
  }

  static async technicianDeactivated(userId, technicianName) {
    return this.create(
      userId,
      'technician_deactivated',
      'Technician Deactivated',
      `${technicianName} has been deactivated`,
      { icon: 'alert-circle', color: 'red' }
    );
  }

  /**
   * PAYMENT NOTIFICATIONS
   */
  
  static async paymentReceived(userId, amount, jobId) {
    return this.create(
      userId,
      'payment_received',
      'Payment Received',
      `Payment of $${amount} has been received for Job #${jobId}`,
      { icon: 'credit-card', color: 'green', link: `/admin/jobs/${jobId}` }
    );
  }

  static async paymentFailed(userId, jobId, reason) {
    return this.create(
      userId,
      'payment_failed',
      'Payment Failed',
      `Payment failed for Job #${jobId}: ${reason}`,
      { icon: 'alert-circle', color: 'red', link: `/admin/jobs/${jobId}` }
    );
  }

  /**
   * REVIEW NOTIFICATIONS
   */
  
  static async newReview(userId, reviewerName, rating, jobId) {
    return this.create(
      userId,
      'new_review',
      'New Review Received',
      `${reviewerName} left a ${rating}-star review`,
      { icon: 'star', color: 'yellow', link: `/admin/reviews` }
    );
  }

  /**
   * FETCH USER NOTIFICATIONS
   */
  
  static async getUserNotifications(userId, limit = 20) {
    try {
      const notifications = await Notification.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        raw: false
      });

      console.log(`✅ Fetched ${notifications.length} notifications for user ${userId}`);
      return notifications;
    } catch (error) {
      console.error('❌ Failed to get user notifications:', error.message);
      return [];
    }
  }

  /**
   * MARK NOTIFICATION AS READ
   */
  
  static async markAsRead(notificationId) {
    try {
      const notification = await Notification.findByPk(notificationId);
      if (!notification) {
        console.warn(`⚠️  Notification ${notificationId} not found`);
        return null;
      }

      await notification.update({ is_read: true });
      console.log(`✅ Notification ${notificationId} marked as read`);
      return notification;
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error.message);
      return null;
    }
  }

  /**
   * MARK ALL NOTIFICATIONS AS READ
   */
  
  static async markAllAsRead(userId) {
    try {
      const result = await Notification.update(
        { is_read: true },
        { where: { user_id: userId, is_read: false } }
      );

      console.log(`✅ Marked ${result[0]} notifications as read for user ${userId}`);
      return result[0]; // Returns count of updated rows
    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error.message);
      return 0;
    }
  }

  /**
   * GET UNREAD COUNT
   */
  
  static async getUnreadCount(userId) {
    try {
      const count = await Notification.count({
        where: { user_id: userId, is_read: false }
      });
      return count;
    } catch (error) {
      console.error('❌ Failed to get unread count:', error.message);
      return 0;
    }
  }

  /**
   * DELETE NOTIFICATION
   */
  
  static async deleteNotification(notificationId) {
    try {
      const result = await Notification.destroy({
        where: { id: notificationId }
      });
      console.log(`✅ Notification ${notificationId} deleted`);
      return result > 0;
    } catch (error) {
      console.error('❌ Failed to delete notification:', error.message);
      return false;
    }
  }

  /**
   * CLEAR OLD NOTIFICATIONS (e.g., older than 30 days)
   */
  
  static async clearOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Notification.destroy({
        where: {
          created_at: {
            [require('sequelize').Op.lt]: cutoffDate
          }
        }
      });

      console.log(`✅ Deleted ${result} notifications older than ${daysOld} days`);
      return result;
    } catch (error) {
      console.error('❌ Failed to clear old notifications:', error.message);
      return 0;
    }
  }
}

module.exports = NotificationService;
