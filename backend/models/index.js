const sequelize = require('../config/db.config');
const User = require('./User.model');
const Service = require('./Service.model');
const Booking = require('./Booking.model');
const Review = require('./Review.model');
const Payment = require('./Payment.model');
const TechnicianService = require('./TechnicianService.model');
const TechnicianServiceArea = require('./TechnicianServiceArea.model');
const TechnicianAvailability = require('./TechnicianAvailability.model');
const TechnicianDocument = require('./TechnicianDocument.model');
const Conversation = require('./Conversation.model');
const Message = require('./Message.model');
const TechnicianSupportConversation = require('./TechnicianSupportConversation.model');
const TechnicianSupportMessage = require('./TechnicianSupportMessage.model');
const PayoutSettlement = require('./PayoutSettlement.model');
const NotificationModel = require('./Notification.model');
const Notification = NotificationModel(sequelize);
// Define relationships
User.belongsToMany(Service, { 
  through: TechnicianService, 
  foreignKey: 'technician_id',
  as: 'services'
});

Service.belongsToMany(User, { 
  through: TechnicianService, 
  foreignKey: 'service_id',
  as: 'technicians'
});
// User -> Bookings (as customer)
User.hasMany(Booking, {
  foreignKey: 'customer_id',
  as: 'customerBookings'
});
Booking.belongsTo(User, {
  foreignKey: 'customer_id',
  as: 'customer'
});

// User -> Bookings (as technician)
User.hasMany(Booking, {
  foreignKey: 'technician_id',
  as: 'technicianBookings'
});
Booking.belongsTo(User, {
  foreignKey: 'technician_id',
  as: 'technician'
});

// Service -> Bookings
Service.hasMany(Booking, {
  foreignKey: 'service_id',
  as: 'bookings'
});
Booking.belongsTo(Service, {
  foreignKey: 'service_id',
  as: 'service'
});

// Booking -> Review
Booking.hasOne(Review, {
  foreignKey: 'booking_id',
  as: 'review'
});
Review.belongsTo(Booking, {
  foreignKey: 'booking_id',
  as: 'booking'
});

// User -> Reviews (as customer)
User.hasMany(Review, {
  foreignKey: 'customer_id',
  as: 'givenReviews'
});
Review.belongsTo(User, {
  foreignKey: 'customer_id',
  as: 'customer'
});

// User -> Reviews (as technician)
User.hasMany(Review, {
  foreignKey: 'technician_id',
  as: 'receivedReviews'
});
Review.belongsTo(User, {
  foreignKey: 'technician_id',
  as: 'technician'
});

// Booking -> Payment
Booking.hasOne(Payment, {
  foreignKey: 'booking_id',
  as: 'payment'
});
Payment.belongsTo(Booking, {
  foreignKey: 'booking_id',
  as: 'booking'
});

// ========== NEW RELATIONSHIPS ==========

// User (Technician) -> Service Areas
User.hasMany(TechnicianServiceArea, {
  foreignKey: 'technician_id',
  as: 'serviceAreas'
});
TechnicianServiceArea.belongsTo(User, {
  foreignKey: 'technician_id',
  as: 'technician'
});

// User (Technician) -> Availability
User.hasMany(TechnicianAvailability, {
  foreignKey: 'technician_id',
  as: 'availability'
});
TechnicianAvailability.belongsTo(User, {
  foreignKey: 'technician_id',
  as: 'technician'
});

// User (Technician) -> Documents
User.hasMany(TechnicianDocument, {
  foreignKey: 'technician_id',
  as: 'documents'
});
TechnicianDocument.belongsTo(User, {
  foreignKey: 'technician_id',
  as: 'technician'
});

// Booking -> Conversation
Booking.hasOne(Conversation, {
  foreignKey: 'booking_id',
  as: 'conversation'
});
Conversation.belongsTo(Booking, {
  foreignKey: 'booking_id',
  as: 'booking'
});

// User (Customer) -> Conversations
User.hasMany(Conversation, {
  foreignKey: 'customer_id',
  as: 'customerConversations'
});
Conversation.belongsTo(User, {
  foreignKey: 'customer_id',
  as: 'customer'
});

// User (Technician) -> Conversations
User.hasMany(Conversation, {
  foreignKey: 'technician_id',
  as: 'technicianConversations'
});
Conversation.belongsTo(User, {
  foreignKey: 'technician_id',
  as: 'technician'
});

// Conversation -> Messages
Conversation.hasMany(Message, {
  foreignKey: 'conversation_id',
  as: 'messages'
});
Message.belongsTo(Conversation, {
  foreignKey: 'conversation_id',
  as: 'conversation'
});

// User -> Messages (as sender)
User.hasMany(Message, {
  foreignKey: 'sender_id',
  as: 'sentMessages'
});
Message.belongsTo(User, {
  foreignKey: 'sender_id',
  as: 'sender'
});

// User -> Notifications
User.hasMany(Notification, {
  foreignKey: 'user_id',
  as: 'notifications'
});
Notification.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Technician payout settlements
User.hasMany(PayoutSettlement, {
  foreignKey: 'technician_id',
  as: 'payoutSettlements'
});
PayoutSettlement.belongsTo(User, {
  foreignKey: 'technician_id',
  as: 'technician'
});

// Admin who processed settlement
User.hasMany(PayoutSettlement, {
  foreignKey: 'settled_by',
  as: 'processedPayoutSettlements'
});
PayoutSettlement.belongsTo(User, {
  foreignKey: 'settled_by',
  as: 'processedBy'
});

// Admin -> Technician support conversations
User.hasMany(TechnicianSupportConversation, {
  foreignKey: 'admin_id',
  as: 'adminSupportConversations'
});
TechnicianSupportConversation.belongsTo(User, {
  foreignKey: 'admin_id',
  as: 'admin'
});

// Technician -> support conversations
User.hasMany(TechnicianSupportConversation, {
  foreignKey: 'technician_id',
  as: 'technicianSupportConversations'
});
TechnicianSupportConversation.belongsTo(User, {
  foreignKey: 'technician_id',
  as: 'technician'
});

// Support conversation -> support messages
TechnicianSupportConversation.hasMany(TechnicianSupportMessage, {
  foreignKey: 'conversation_id',
  as: 'messages'
});
TechnicianSupportMessage.belongsTo(TechnicianSupportConversation, {
  foreignKey: 'conversation_id',
  as: 'conversation'
});

// User -> support messages
User.hasMany(TechnicianSupportMessage, {
  foreignKey: 'sender_id',
  as: 'sentSupportMessages'
});
TechnicianSupportMessage.belongsTo(User, {
  foreignKey: 'sender_id',
  as: 'sender'
});

module.exports = {
  sequelize,
  User,
  Service,
  Booking,
  Review,
  Payment,
  TechnicianService,
  TechnicianServiceArea,
  TechnicianAvailability,
  TechnicianDocument,
  Conversation,
  Message,
  TechnicianSupportConversation,
  TechnicianSupportMessage,
  PayoutSettlement,
  Notification
};
