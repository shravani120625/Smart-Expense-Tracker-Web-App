const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

// @desc    Get all budgets
// @route   GET /api/budgets
// @access  Private
exports.getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id });
    res.status(200).json({ success: true, count: budgets.length, data: budgets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Upsert budget (Create or update if exists)
// @route   POST /api/budgets
// @access  Private
exports.upsertBudget = async (req, res) => {
  try {
    const { category, limit, period, currency } = req.body;

    if (!limit) {
      return res.status(400).json({ success: false, error: 'Please specify a budget limit' });
    }

    const budgetCategory = category || 'Overall';
    const budgetCurrency = currency || req.user.currency || 'INR';

    // Find and update or create
    let budget = await Budget.findOne({ user: req.user.id, category: budgetCategory });

    if (budget) {
      budget.limit = parseFloat(limit);
      budget.currency = budgetCurrency;
      budget.period = period || 'monthly';
      await budget.save();
    } else {
      budget = await Budget.create({
        user: req.user.id,
        category: budgetCategory,
        limit: parseFloat(limit),
        period: period || 'monthly',
        currency: budgetCurrency
      });
    }

    res.status(200).json({ success: true, data: budget });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ success: false, error: 'Budget not found' });
    }

    if (budget.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'User not authorized' });
    }

    await budget.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get budget status and current month's spending usage
// @route   GET /api/budgets/status
// @access  Private
exports.getBudgetStatus = async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id });
    
    // Find start and end of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Fetch all transactions in the current month
    const transactions = await Transaction.find({
      user: req.user.id,
      type: 'expense',
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const statusReport = budgets.map(budget => {
      let spent = 0;

      if (budget.category === 'Overall') {
        // Sum all base amount expenses
        spent = transactions.reduce((sum, t) => sum + t.amountBase, 0);
      } else {
        // Sum expenses in matching category
        spent = transactions
          .filter(t => t.category.toLowerCase() === budget.category.toLowerCase())
          .reduce((sum, t) => sum + t.amountBase, 0);
      }

      // Round values
      spent = Math.round(spent * 100) / 100;
      const progress = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

      return {
        id: budget._id,
        category: budget.category,
        limit: budget.limit,
        spent,
        remaining: Math.max(0, Math.round((budget.limit - spent) * 100) / 100),
        progress: Math.round(progress * 100) / 100,
        isAlert: progress >= 85, // trigger alert at 85% utilization
        currency: req.user.currency
      };
    });

    res.status(200).json({ success: true, data: statusReport });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
