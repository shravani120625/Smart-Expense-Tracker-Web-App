import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Budgets from './pages/Budgets';
import Import from './pages/Import';
import { Wallet, LayoutDashboard, CalendarDays, UploadCloud, LogOut, Loader2 } from 'lucide-react';

// Wrapper component to protect pages
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center gap-3">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
        <span className="text-slate-400 text-sm font-semibold">Validating session...</span>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Application Main Layout
const AppLayout = ({ children }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Premium Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex h-16 items-center justify-between">
          
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-white text-base tracking-tight hidden sm:inline-block">
              Smart Expense Tracker
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-4">
            <Link 
              to="/" 
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 text-indigo-500" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            
            <Link 
              to="/budgets" 
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
            >
              <CalendarDays className="h-4 w-4 text-indigo-500" />
              <span className="hidden sm:inline">Budgets</span>
            </Link>
            
            <Link 
              to="/import" 
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
            >
              <UploadCloud className="h-4 w-4 text-indigo-500" />
              <span className="hidden sm:inline">Import</span>
            </Link>
          </nav>

          {/* Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-xs text-white font-bold">{user?.name}</p>
              <p className="text-[10px] text-indigo-400 font-semibold">{user?.currency || 'INR'} Base</p>
            </div>

            <button
              onClick={handleLogoutClick}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
              title="Logout session"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Primary Page Canvas */}
      <main className="flex-1 bg-slate-950 pb-16">
        {children}
      </main>

      {/* Small footer */}
      <footer className="border-t border-slate-900/60 bg-slate-950 py-4 text-center text-[10px] text-slate-600">
        Smart Expense Tracker &copy; {new Date().getFullYear()} Course Project. Created for GitHub Proof-of-Work.
      </footer>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public login/register routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected main workspace pages */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/budgets"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Budgets />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/import"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Import />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch all redirections */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
