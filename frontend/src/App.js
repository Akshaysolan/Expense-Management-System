// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth, authAxios } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ExpensesPage from './pages/ExpensesPage';
import ExpenseDetailPage from './pages/ExpenseDetailPage';
import TripsPage from './pages/TripsPage';
import TripDetailPage from './pages/TripDetailPage';
import ApprovalsPage from './pages/ApprovalsPage';
import ApprovalDetailPage from './pages/ApprovalDetailPage';
import SettingsPage from './pages/SettingsPage';
import SupportPage from './pages/SupportPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UserProfilePage from './pages/UserProfilePage';
import ReportsPage from './pages/ReportsPage';
import MonthlyReportPage from './pages/MonthlyReportPage';
import AuditLogsPage from './pages/AuditLogsPage';

// ── Route guard: redirect to /login if not authenticated ──
function PrivateRoute({ children, requiredRole = null }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check role-based access
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

// ── Route guard: redirect away from auth pages if already logged in ──
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

// ── Main authenticated layout ───────────────────────────────
function AppLayout() {
  const [dashboardData, setDashboardData] = useState({
    expenses: [],
    pending_tasks: [],
    monthly_report: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      marketing: [1200, 1500, 1100, 1800],
      sales: [2100, 1900, 2200, 2000],
      finance: [800, 950, 1100, 900],
    },
    stats: {},
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(null);

  // Desktop: collapsed state (persisted)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Mobile detection + mobile drawer state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isSidebarCollapsed = isMobile ? !mobileSidebarOpen : sidebarCollapsed;

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen(prev => !prev);
    } else {
      setSidebarCollapsed(prev => !prev);
    }
  };

  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  useEffect(() => {
    const root = document.querySelector('.app');
    if (!root) return;
    if (isMobile) {
      root.classList.remove('sidebar-collapsed');
    } else if (sidebarCollapsed) {
      root.classList.add('sidebar-collapsed');
    } else {
      root.classList.remove('sidebar-collapsed');
    }
  }, [sidebarCollapsed, isMobile]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMobileSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setDataLoading(true);
      const response = await authAxios.get('/dashboard/');
      setDashboardData(prev => ({ ...prev, ...response.data }));
      setDataError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setDataError('Failed to load dashboard data. Please check if the backend server is running.');
    } finally {
      setDataLoading(false);
    }
  };

  const handlePDFUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await authAxios.post('/upload-pdf/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(`✅ PDF uploaded successfully! Found ${response.data.expenses_found} expenses.`);
      await fetchDashboardData();
    } catch (err) {
      console.error('Upload error:', err);
      alert('❌ Error uploading PDF: ' + (err.response?.data?.error || err.message));
    }
  };

  if (dataLoading && !dashboardData.expenses.length) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="error-container">
        <h2>⚠️ Error</h2>
        <p>{dataError}</p>
        <button onClick={fetchDashboardData} className="retry-btn">
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className={`app ${!isMobile && sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        isMobile={isMobile}
        closeMobileSidebar={closeMobileSidebar}
      />
      <main className="main-content">
        <Header
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          isMobile={isMobile}
          toggleMobileSidebar={toggleSidebar}
        />
        <div className="content-wrapper">
          <Routes>
            {/* Main Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              <Dashboard data={dashboardData} onPDFUpload={handlePDFUpload} />
            } />
            
            {/* Expense Routes */}
            <Route path="/expenses" element={
              <ExpensesPage expenses={dashboardData.expenses} />
            } />
            <Route path="/expenses/:id" element={<ExpenseDetailPage />} />
            
            {/* Trip Routes */}
            <Route path="/trips" element={<TripsPage />} />
            <Route path="/trips/:id" element={<TripDetailPage />} />
            
            {/* Approval Routes */}
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/approvals/:id" element={<ApprovalDetailPage />} />
            
            {/* Profile Route */}
            <Route path="/profile/:userId" element={<UserProfilePage />} />
            
            {/* Report Routes */}
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/monthly/:year/:month" element={<MonthlyReportPage />} />
            
            {/* Settings and Support */}
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/support" element={<SupportPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

// ── Admin layout ────────────────────────────────────────────
function AdminLayout() {
  return (
    <div className="admin-app">
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/users" element={<div>User Management Page</div>} />
        <Route path="/users/:id" element={<div>User Detail Page</div>} />
        <Route path="/teams" element={<div>Team Management Page</div>} />
        <Route path="/teams/:id" element={<div>Team Detail Page</div>} />
        <Route path="/logs" element={<AuditLogsPage />} />
        <Route path="/settings" element={<div>System Settings Page</div>} />
      </Routes>
    </div>
  );
}

// ── Root: wraps everything in providers + defines top-level routes ──
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
            <Route path="/reset-password/:token" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

            {/* Admin Routes - require admin role */}
            <Route path="/admin/*" element={
              <PrivateRoute requiredRole="admin">
                <AdminLayout />
              </PrivateRoute>
            } />

            {/* Regular User Routes - require authentication */}
            <Route path="/*" element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;