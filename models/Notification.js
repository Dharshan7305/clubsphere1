const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null indicates broadcast to all students
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    default: null
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['recruitment', 'event', 'application', 'approval', 'admin', 'announcement', 'general'],
    default: 'general'
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  relatedLink: {
    type: String,
    default: '#'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual aliases matching standard naming requirements
NotificationSchema.virtual('notification_id').get(function() {
  return this._id;
});

NotificationSchema.virtual('user_id').get(function() {
  return this.recipient;
});

NotificationSchema.virtual('notification_type').get(function() {
  return this.type;
});

NotificationSchema.virtual('related_id').get(function() {
  return this.relatedId;
});

NotificationSchema.virtual('is_read').get(function() {
  return this.isRead;
});

NotificationSchema.virtual('created_at').get(function() {
  return this.createdAt;
});

module.exports = mongoose.model('Notification', NotificationSchema);
