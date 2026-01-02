const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01,
    max: 1000000,
  },
  paidBy: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Food', 'Transport', 'Accommodation', 'Entertainment', 'Shopping','Travel','Health','Utilities','Work', 'Other'],
  },
  splitWith: [{
    type: String,
    trim: true,
  }],
  splitType: {
    type: String,
    enum: ['equal', 'percentage', 'custom'],
    default: 'equal',
  },
  splitAmounts: {
    type: Map,
    of: Number,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

// Index for efficient queries
expenseSchema.index({ groupId: 1, date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
