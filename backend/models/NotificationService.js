const { Notification } = require('../models');

class NotificationService {
  
  // ==========================================
  // CORE FUNCTION - Create Notification
  // ==========================================
  static async create(userId, type, title, message, options = {}) {
    try {
      const notification = await Notification.create({
        user_id: userId,
        type,
        title,
        message,
        icon: options.icon || 'bell',
        color: options.color || 'blue',
        link: options.link || null
      });
      
      console.log(`✅ Notification created: ${title}`);
      return notification;
    } catch (error) {
      console.error('❌ Failed to create notification:', error);
      return null;
    }
  }

  // ==========================================
  // PROFILE & ACCOUNT NOTIFICATIONS
  // ==========================================
  
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

  // ==========================================
  // JOB NOTIFICATIONS
  // ==========================================
  
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
      `Job #${jobId} was cancelled. Reason: ${reason}`,
      { icon: 'alert', color: 'red', link: `/admin/jobs/${jobId}` }
    );
  }

  static async jobReassigned(userId, jobId, oldTech, newTech) {
    return this.create(
      userId,
      'job_reassigned',
      'Job Reassigned',
      `Job #${jobId} reassigned from ${oldTech} to ${newTech}`,
      { icon: 'users', color: 'orange', link: `/admin/jobs/${jobId}` }
    );
  }

  // ==========================================
  // PAYMENT NOTIFICATIONS
  // ==========================================
  
  static async paymentReceived(userId, jobId, amount) {
    return this.create(
      userId,
      'payment_received',
      'Payment Received',
      `रू ${amount} received for Job #${jobId}`,
      { icon: 'dollar', color: 'green', link: `/admin/revenue` }
    );
  }

  static async paymentFailed(userId, jobId, reason) {
    return this.create(
      userId,
      'payment_failed',
      'Payment Failed',
      `Payment for Job #${jobId} failed. Reason: ${reason}`,
      { icon: 'alert', color: 'red', link: `/admin/jobs/${jobId}` }
    );
  }

  static async refundIssued(userId, jobId, amount) {
    return this.create(
      userId,
      'refund_issued',
      'Refund Issued',
      `रू ${amount} refunded for Job #${jobId}`,
      { icon: 'dollar', color: 'orange', link: `/admin/revenue` }
    );
  }

  static async monthlyPayoutReady(userId, month, totalAmount) {
    return this.create(
      userId,
      'payout_ready',
      'Monthly Payout Ready',
      `${month} payout of रू ${totalAmount} is ready to be transferred`,
      { icon: 'dollar', color: 'green', link: `/admin/revenue` }
    );
  }

  // ==========================================
  // TECHNICIAN NOTIFICATIONS
  // ==========================================
  
  static async technicianHired(userId, technicianName) {
    return this.create(
      userId,
      'technician_hired',
      'New Technician Hired',
      `${technicianName} has been added to your team`,
      { icon: 'users', color: 'purple', link: `/admin/technicians` }
    );
  }

  static async technicianActivated(userId, technicianName) {
    return this.create(
      userId,
      'technician_activated',
      'Technician Activated',
      `${technicianName} is now active and available for jobs`,
      { icon: 'users', color: 'green', link: `/admin/technicians` }
    );
  }

  static async technicianDeactivated(userId, technicianName, reason) {
    return this.create(
      userId,
      'technician_deactivated',
      'Technician Deactivated',
      `${technicianName} is now inactive. Reason: ${reason}`,
      { icon: 'users', color: 'red', link: `/admin/technicians` }
    );
  }

  static async technicianUnavailable(userId, technicianName, dates) {
    return this.create(
      userId,
      'technician_unavailable',
      'Technician Unavailable',
      `${technicianName} marked unavailable for ${dates}`,
      { icon: 'users', color: 'orange', link: `/admin/technicians` }
    );
  }

  static async technicianSupportTicket(userId, technicianName, subject) {
    return this.create(
      userId,
      'support_ticket',
      'New Support Request',
      `${technicianName}: ${subject}`,
      { icon: 'alert', color: 'orange', link: `/admin/messages` }
    );
  }

  // ==========================================
  // REVIEW NOTIFICATIONS
  // ==========================================
  
  static async newReview(userId, jobId, customerName, rating, technicianName) {
    const stars = '⭐'.repeat(rating);
    return this.create(
      userId,
      'new_review',
      'New Review Posted',
      `${customerName} rated ${technicianName} ${stars} (${rating}/5) for Job #${jobId}`,
      { icon: 'briefcase', color: 'blue', link: `/admin/jobs/${jobId}` }
    );
  }

  static async lowRatingAlert(userId, technicianName, rating) {
    return this.create(
      userId,
      'low_rating_alert',
      'Low Rating Alert',
      `${technicianName} received a ${rating}/5 rating. Consider follow-up.`,
      { icon: 'alert', color: 'red', link: `/admin/technicians` }
    );
  }

  // ==========================================
  // SYSTEM NOTIFICATIONS
  // ==========================================
  
  static async disputeReported(userId, jobId, reportedBy) {
    return this.create(
      userId,
      'dispute_reported',
      'Dispute Reported',
      `${reportedBy} reported an issue with Job #${jobId}`,
      { icon: 'alert', color: 'red', link: `/admin/jobs/${jobId}` }
    );
  }

  static async systemAlert(userId, title, message) {
    return this.create(
      userId,
      'system_alert',
      title,
      message,
      { icon: 'alert', color: 'orange' }
    );
  }

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================
  
  static async getUserNotifications(userId, limit = 20) {
    try {
      const notifications = await Notification.findAll({
        where: { user_id: userId },
        order: [['createdAt', 'DESC']],
        limit
      });
      return notifications;
    } catch (error) {
      console.error('❌ Failed to fetch notifications:', error);
      return [];
    }
  }

  static async markAsRead(notificationId) {
    try {
      await Notification.update(
        { is_read: true },
        { where: { id: notificationId } }
      );
      return true;
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
      return false;
    }
  }

  static async markAllAsRead(userId) {
    try {
      await Notification.update(
        { is_read: true },
        { where: { user_id: userId, is_read: false } }
      );
      return true;
    } catch (error) {
      console.error('❌ Failed to mark all as read:', error);
      return false;
    }
  }

  static async delete(notificationId) {
    try {
      await Notification.destroy({ where: { id: notificationId } });
      return true;
    } catch (error) {
      console.error('❌ Failed to delete notification:', error);
      return false;
    }
  }

  static async deleteAllForUser(userId) {
    try {
      await Notification.destroy({ where: { user_id: userId } });
      return true;
    } catch (error) {
      console.error('❌ Failed to delete notifications:', error);
      return false;
    }
  }
}

module.exports = NotificationService;