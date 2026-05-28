const Transaction = require('../models/Transaction');
const { suggestCategory } = require('../utils/categorizer');
const { convertCurrency } = require('../utils/currency');

// @desc    Get all transactions for the user
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    const { category, type, startDate, endDate, search, page = 1, limit = 10 } = req.query;

    const query = { user: req.user.id };

    // Apply filters
    if (category) {
      query.category = category;
    }
    if (type) {
      query.type = type;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }
    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    // Pagination
    const skip = (page - 1) * limit;
    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: transactions
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create a transaction
// @route   POST /api/transactions
// @access  Private
exports.createTransaction = async (req, res) => {
  try {
    const { amount, type, currency, description, category, date, source } = req.body;

    if (!amount || !type) {
      return res.status(400).json({ success: false, error: 'Please add an amount and type' });
    }

    // Auto-categorize if not provided
    let finalCategory = category;
    if (!finalCategory || finalCategory.trim() === '') {
      finalCategory = suggestCategory(description);
    }

    const txnCurrency = currency || req.user.currency || 'INR';
    
    // Convert to base currency
    const amountBase = convertCurrency(
      parseFloat(amount),
      txnCurrency,
      req.user.currency
    );

    const transaction = await Transaction.create({
      user: req.user.id,
      amount: parseFloat(amount),
      type,
      currency: txnCurrency,
      amountBase,
      description,
      category: finalCategory,
      date: date ? new Date(date) : new Date(),
      source: source || 'manual'
    });

    res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
exports.updateTransaction = async (req, res) => {
  try {
    let transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    // Make sure user owns the transaction
    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'User not authorized to update this transaction' });
    }

    const { amount, type, currency, description, category, date } = req.body;

    // Build update object
    const updateData = {};
    if (amount) updateData.amount = parseFloat(amount);
    if (type) updateData.type = type;
    if (currency) updateData.currency = currency;
    if (description !== undefined) updateData.description = description;
    if (category) updateData.category = category;
    if (date) updateData.date = new Date(date);

    // If amount or currency changed, recalculate base currency
    const finalAmount = amount ? parseFloat(amount) : transaction.amount;
    const finalCurrency = currency ? currency : transaction.currency;
    updateData.amountBase = convertCurrency(
      finalAmount,
      finalCurrency,
      req.user.currency
    );

    transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    // Make sure user owns the transaction
    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'User not authorized to delete this transaction' });
    }

    await transaction.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
