import React, { useState, useEffect } from 'react';
import { budgetService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Shield, PlusCircle, Trash2, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';

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

const Budgets = () => {
  const { user } = useAuth();
  const baseCurrency = user?.currency || 'INR';
  const symbol = CURRENCY_SYMBOLS[baseCurrency] || baseCurrency;

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Form Fields
  const [category, setCategory] = useState('Overall');
  const [limit, setLimit] = useState('');
  const [period, setPeriod] = useState('monthly');

  const categoryOptions = ['Overall', 'Food', 'Rent', 'Travel', 'Shopping', 'Bills', 'Education', 'Other'];

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await budgetService.getStatus();
      if (res.success) {
        setBudgets(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to pull budget status reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!limit) return;
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      const res = await budgetService.upsert({
        category,
        limit: parseFloat(limit),
        period,
        currency: baseCurrency
      });

      if (res.success) {
        setLimit('');
        setMessage(`Successfully configured ${category} budget threshold!`);
        fetchBudgets();
      }
    } catch (err) {
      setError(err.message || 'Configuring budget failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Wipe this budget limit configuration?')) return;
    setError('');
    setMessage('');
    try {
      const res = await budgetService.delete(id);
      if (res.success) {
        setMessage('Budget limit deleted successfully!');
        fetchBudgets();
      }
    } catch (err) {
      setError(err.message || 'Wiping budget failed.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Budget Planner</h1>
        <p className="text-slate-400 text-sm">Configure monthly limits by category to trigger overspending notifications.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-200 text-sm flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          {error}
        </div>
      )}

      {message && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-200 text-sm flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-emerald-400 shrink-0" />
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Input Form Column */}
        <div>
          <div className="glass-card">
            <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-indigo-500" />
              Configure Budget Limit
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-select"
                >
                  {categoryOptions.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Monthly Limit ({symbol})</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">
                    {symbol}
                  </span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    className="form-input pl-8"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Billing Cycle</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="form-select"
                >
                  <option value="monthly">Monthly Cycle</option>
                  <option value="weekly">Weekly Cycle</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-primary font-bold text-xs pt-3"
              >
                {submitting ? 'Setting up...' : 'Save Limit'}
              </button>
            </form>
          </div>
        </div>

        {/* Budgets Listing Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card">
            <h3 className="text-lg font-bold text-white mb-6">Current Budgets Status</h3>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="h-8 w-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              </div>
            ) : budgets.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl">
                <Shield className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No active budgets configured. Add limits to monitor thresholds.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {budgets.map(b => (
                  <div key={b.id} className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-3 relative group">
                    
                    {/* Header line */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-white uppercase text-xs tracking-wider capitalize flex items-center gap-1.5">
                          {b.category} Budget
                          {b.isAlert && (
                            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertTriangle className="h-2.5 w-2.5" /> Warning
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Renews start of calendar cycle</p>
                      </div>

                      {/* Delete button */}
                      <button 
                        onClick={() => handleDelete(b.id)}
                        className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-rose-500 rounded transition-colors duration-200"
                        title="Delete Budget"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Progress details */}
                    <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                      <div>
                        <p className="text-slate-500 text-[10px] uppercase">Spent</p>
                        <p className="text-white text-sm mt-0.5">{symbol}{b.spent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px] uppercase">Limit</p>
                        <p className="text-white text-sm mt-0.5">{symbol}{b.limit.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500 text-[10px] uppercase">Remaining</p>
                        <p className={`text-sm mt-0.5 font-bold ${b.remaining > 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                          {symbol}{b.remaining.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Progress Slider */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${Math.min(100, b.progress)}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            b.progress >= 85 ? 'bg-rose-500' : b.progress >= 60 ? 'bg-amber-500' : 'bg-indigo-500'
                          }`}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                        <span>{b.progress}% utilized</span>
                        {b.progress >= 85 ? (
                          <span className="text-rose-400">Exceeded warning limit</span>
                        ) : (
                          <span className="text-slate-500">Safe zone</span>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Budgets;
