import React, { useState, useEffect } from 'react';
import { transactionService, reportService, budgetService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, TrendingDown, DollarSign, PlusCircle, Trash2, Edit2, 
  AlertTriangle, Filter, Search, Calendar, RefreshCw 
} from 'lucide-react';

// Chart.js imports & registration
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  JPY: '¥'
};

const Dashboard = () => {
  const { user } = useAuth();
  const baseCurrency = user?.currency || 'INR';
  const symbol = CURRENCY_SYMBOLS[baseCurrency] || baseCurrency;

  // State definitions
  const [kpis, setKpis] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [categories, setCategories] = useState([]);
  const [trends, setTrends] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [currency, setCurrency] = useState(baseCurrency);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  // Editing transaction state
  const [editingId, setEditingId] = useState(null);

  // Filters & search states
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Categories list options
  const categoryOptions = ['Food', 'Rent', 'Travel', 'Shopping', 'Bills', 'Education', 'Salary', 'Allowance', 'Other'];

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch dashboard metrics
      const dashRes = await reportService.getDashboard();
      if (dashRes.success) {
        setKpis(dashRes.data.kpis);
        setCategories(dashRes.data.categoryBreakdown);
        setTrends(dashRes.data.monthlyTrends);
      }

      // Fetch transaction list with current filters
      const txParams = {
        page,
        limit: 8,
        category: filterCategory,
        type: filterType,
        search: searchQuery
      };
      const txRes = await transactionService.getAll(txParams);
      if (txRes.success) {
        setTransactions(txRes.data);
        setTotalPages(txRes.pages);
      }

      // Fetch budget statuses
      const budRes = await budgetService.getStatus();
      if (budRes.success) {
        setBudgets(budRes.data);
      }
    } catch (err) {
      setError(err.message || 'Error pulling data. Check MongoDB server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, filterCategory, filterType, searchQuery]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!amount) return;
    setError('');
    setSubmitting(true);

    try {
      if (editingId) {
        // Update transaction
        const res = await transactionService.update(editingId, {
          amount: parseFloat(amount),
          type,
          currency,
          description,
          category,
          date
        });
        if (res.success) {
          setEditingId(null);
        }
      } else {
        // Create transaction
        await transactionService.create({
          amount: parseFloat(amount),
          type,
          currency,
          description,
          category,
          date
        });
      }

      // Reset form fields
      setAmount('');
      setDescription('');
      setCategory('');
      setDate(new Date().toISOString().slice(0, 10));
      setCurrency(baseCurrency);
      setType('expense');

      // Refresh listings & KPIs
      fetchData();
    } catch (err) {
      setError(err.message || 'Submitting transaction failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (txn) => {
    setEditingId(txn._id);
    setAmount(txn.amount);
    setType(txn.type);
    setCurrency(txn.currency);
    setDescription(txn.description || '');
    setCategory(txn.category);
    setDate(new Date(txn.date).toISOString().slice(0, 10));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setDescription('');
    setCategory('');
    setDate(new Date().toISOString().slice(0, 10));
    setCurrency(baseCurrency);
    setType('expense');
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Delete this transaction item?')) return;
    try {
      await transactionService.delete(id);
      fetchData();
    } catch (err) {
      setError(err.message || 'Deleting transaction failed.');
    }
  };

  // Setup Doughnut chart data
  const categoryChartData = {
    labels: categories.length > 0 ? categories.map(c => c.category) : ['No Expenses'],
    datasets: [{
      data: categories.length > 0 ? categories.map(c => c.amount) : [1],
      backgroundColor: [
        '#6366f1', // Indigo
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#ef4444', // Rose
        '#3b82f6', // Blue
        '#8b5cf6', // Violet
        '#ec4899', // Pink
        '#14b8a6', // Teal
        '#64748b'  // Slate
      ],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  // Setup Cashflow chart data
  const trendChartData = {
    labels: trends.map(t => t.label),
    datasets: [
      {
        label: 'Income',
        data: trends.map(t => t.income),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#10b981'
      },
      {
        label: 'Expenses',
        data: trends.map(t => t.expense),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#ef4444'
      }
    ]
  };

  const trendChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: '#94a3b8' }
      }
    },
    scales: {
      x: {
        grid: { color: '#1e293b' },
        ticks: { color: '#94a3b8' }
      },
      y: {
        grid: { color: '#1e293b' },
        ticks: { color: '#94a3b8' }
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Financial Dashboard</h1>
          <p className="text-slate-400 text-sm">Welcome back, <span className="text-indigo-400 font-semibold">{user?.name}</span>. Let's analyze your savings.</p>
        </div>
        <button 
          onClick={fetchData} 
          className="btn-secondary self-start md:self-auto text-xs py-2 px-3 flex items-center gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Sync Data
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-200 text-sm flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Income Card */}
        <div className="glass-card glass-card-hover flex items-center gap-5 border-l-4 border-l-emerald-500">
          <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Income</p>
            <p className="text-2xl font-black text-white mt-1">{symbol}{kpis.totalIncome.toLocaleString()}</p>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="glass-card glass-card-hover flex items-center gap-5 border-l-4 border-l-rose-500">
          <div className="p-4 bg-rose-500/10 text-rose-400 rounded-xl">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Expenses</p>
            <p className="text-2xl font-black text-white mt-1">{symbol}{kpis.totalExpense.toLocaleString()}</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="glass-card glass-card-hover flex items-center gap-5 border-l-4 border-l-indigo-500">
          <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Balance</p>
            <p className={`text-2xl font-black mt-1 ${kpis.balance >= 0 ? 'text-white' : 'text-rose-400'}`}>
              {kpis.balance < 0 ? '-' : ''}{symbol}{Math.abs(kpis.balance).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Budget Alerts Threshold */}
      {budgets.some(b => b.isAlert) && (
        <div className="mb-8 p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3">
          <h4 className="text-amber-400 font-bold text-sm flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Active Budget Alerts (Exceeded 85% limit)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.filter(b => b.isAlert).map(b => (
              <div key={b.id} className="text-xs text-amber-200/90 bg-slate-950/40 p-3 rounded-xl border border-amber-500/10">
                Category <span className="font-bold text-white capitalize">{b.category}</span>: 
                Spent <span className="font-bold text-white">{symbol}{b.spent}</span> of limit <span className="font-bold text-white">{symbol}{b.limit}</span> ({b.progress}%)
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primary Layout Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form & Budgets summary */}
        <div className="space-y-8">
          
          {/* Add/Edit Form */}
          <div className="glass-card">
            <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-indigo-500" />
              {editingId ? 'Edit Transaction' : 'Add Transaction'}
            </h3>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="form-label">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                      type === 'expense'
                        ? 'bg-rose-500/10 border-rose-500 text-rose-400 shadow-sm'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                      type === 'income'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-sm'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">Amount</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                    {CURRENCY_SYMBOLS[currency] || currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="form-input pl-9"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="form-select"
                  >
                    {Object.keys(CURRENCY_SYMBOLS).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Auto-Detect</option>
                    {categoryOptions.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Date</label>
                <div className="relative">
                  <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 h-4.5 w-4.5 pointer-events-none" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Starbucks Flat White"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full text-xs"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update' : 'Save'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="btn-secondary w-full text-xs"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Budget Limits Summary widget */}
          <div className="glass-card">
            <h3 className="text-lg font-bold text-white mb-4">Budget Progress</h3>
            {budgets.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No budgets set. Navigate to Budgets tab to configure limits.</p>
            ) : (
              <div className="space-y-4">
                {budgets.map(b => (
                  <div key={b.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="capitalize text-slate-300">{b.category}</span>
                      <span className="text-slate-400">
                        {symbol}{b.spent} / {symbol}{b.limit}
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${Math.min(100, b.progress)}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          b.progress >= 85 ? 'bg-rose-500' : b.progress >= 60 ? 'bg-amber-500' : 'bg-indigo-500'
                        }`}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Charts & Transactions */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Pie */}
            <div className="glass-card flex flex-col justify-between">
              <h4 className="text-sm font-bold text-slate-300 mb-4">Current Month Expenses</h4>
              <div className="h-64 flex items-center justify-center relative">
                {categories.length === 0 ? (
                  <p className="text-xs text-slate-500">No expenses this month</p>
                ) : (
                  <Doughnut 
                    data={categoryChartData} 
                    options={{ 
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } }
                      }
                    }} 
                  />
                )}
              </div>
            </div>

            {/* Cashflow Trends */}
            <div className="glass-card flex flex-col justify-between">
              <h4 className="text-sm font-bold text-slate-300 mb-4">6-Month Cashflow Trend</h4>
              <div className="h-64 flex items-center justify-center">
                {trends.length === 0 ? (
                  <p className="text-xs text-slate-500">No history available</p>
                ) : (
                  <Line data={trendChartData} options={trendChartOptions} />
                )}
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="glass-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
              
              {/* Filter toggles */}
              <div className="flex flex-wrap gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search desc..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Category filter */}
                <select
                  value={filterCategory}
                  onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300"
                >
                  <option value="">All Categories</option>
                  {categoryOptions.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                {/* Type filter */}
                <select
                  value={filterType}
                  onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300"
                >
                  <option value="">All Types</option>
                  <option value="expense">Expenses</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="h-8 w-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-12">No transactions matching search criteria.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Description</th>
                      <th className="pb-3 font-semibold">Category</th>
                      <th className="pb-3 font-semibold">Source</th>
                      <th className="pb-3 font-semibold text-right">Amount</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(t => {
                      const isExpense = t.type === 'expense';
                      return (
                        <tr key={t._id} className="border-b border-slate-850 hover:bg-slate-900/30">
                          <td className="py-3 text-slate-300">
                            {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="py-3 font-semibold text-slate-200">
                            {t.description || '-'}
                          </td>
                          <td className="py-3 text-slate-400 capitalize">
                            <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-full text-[10px]">
                              {t.category}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500 uppercase text-[10px]">
                            {t.source || 'manual'}
                          </td>
                          <td className={`py-3 text-right font-bold text-sm ${isExpense ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {isExpense ? '-' : '+'}{CURRENCY_SYMBOLS[t.currency] || t.currency}{t.amount.toLocaleString()}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button 
                                onClick={() => handleEditClick(t)} 
                                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                                title="Edit"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteClick(t._id)} 
                                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-500"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-850">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-slate-400 text-xs font-semibold">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                      className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
