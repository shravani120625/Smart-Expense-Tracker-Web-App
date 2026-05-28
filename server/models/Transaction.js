const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add a positive amount']
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Transaction type must be income or expense']
  },
  currency: {
    type: String,
    default: 'INR',
    uppercase: true,
    trim: true
  },
  amountBase: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    trim: true,
    maxLength: [100, 'Description cannot exceed 100 characters']
  },
  category: {
    type: String,
    default: 'Uncategorized',
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    enum: ['manual', 'csv', 'ocr'],
    default: 'manual'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
