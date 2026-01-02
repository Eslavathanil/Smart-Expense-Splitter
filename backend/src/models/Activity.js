const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['expense_added', 'expense_deleted', 'member_added', 'member_removed', 'settlement_recorded', 'group_updated'],
  },
  description: {
    type: String,
    required: true,
    maxlength: 500,
  },
  amount: {
    type: Number,
  },
  userName: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
}, { timestamps: true });

// Index for efficient queries
activitySchema.index({ groupId: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
