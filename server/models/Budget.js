const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Please specify a category (or "Overall" for entire spending)'],
    default: 'Overall',
    trim: true
  },
  limit: {
    type: Number,
    required: [true, 'Please add a budget limit amount']
  },
  period: {
    type: String,
    enum: ['monthly', 'weekly'],
    default: 'monthly'
  },
  currency: {
    type: String,
    default: 'INR',
    uppercase: true,
    trim: true
  },
  startDate: {
    type: Date,
    default: () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1); // default to start of current month
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Budget', BudgetSchema);
