const Transaction = require('../models/Transaction');

// @desc    Get dashboard summary statistics (KPIs, category pie chart, cashflow line chart)
// @route   GET /api/reports/dashboard
// @access  Private
exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Date references
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 1. Current Month Transactions for KPIs
    const thisMonthTxns = await Transaction.find({
      user: userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    let totalIncome = 0;
    let totalExpense = 0;

    thisMonthTxns.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amountBase;
      } else {
        totalExpense += t.amountBase;
      }
    });

    totalIncome = Math.round(totalIncome * 100) / 100;
    totalExpense = Math.round(totalExpense * 100) / 100;
    const balance = Math.round((totalIncome - totalExpense) * 100) / 100;

    // 2. Category allocation for current month expenses
    const categoryMap = {};
    thisMonthTxns.forEach(t => {
      if (t.type === 'expense') {
        const cat = t.category || 'Other';
        categoryMap[cat] = (categoryMap[cat] || 0) + t.amountBase;
      }
    });

    const categoryBreakdown = Object.keys(categoryMap).map(cat => ({
      category: cat,
      amount: Math.round(categoryMap[cat] * 100) / 100
    })).sort((a, b) => b.amount - a.amount);

    // 3. Last 6 Months Cashflow trends
    // Construct query for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const sixMonthsTxns = await Transaction.find({
      user: userId,
      date: { $gte: sixMonthsAgo }
    });

    // Bucket by year-month
    const monthlyMap = {};
    // Pre-populate last 6 months to ensure zero values are represented
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyMap[key] = { monthKey: key, label, income: 0, expense: 0 };
    }

    sixMonthsTxns.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) {
        if (t.type === 'income') {
          monthlyMap[key].income += t.amountBase;
        } else {
          monthlyMap[key].expense += t.amountBase;
        }
      }
    });

    const monthlyTrends = Object.keys(monthlyMap).map(key => ({
      label: monthlyMap[key].label,
      income: Math.round(monthlyMap[key].income * 100) / 100,
      expense: Math.round(monthlyMap[key].expense * 100) / 100
    })).sort((a, b) => a.label.localeCompare(b.label)); // sort chronologically

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalIncome,
          totalExpense,
          balance,
          currency: req.user.currency
        },
        categoryBreakdown,
        monthlyTrends
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
