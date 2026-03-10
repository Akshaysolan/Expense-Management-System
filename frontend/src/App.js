// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ExpensesPage from './pages/ExpensesPage';
import TripsPage from './pages/TripsPage';
import ApprovalsPage from './pages/ApprovalsPage';
import SettingsPage from './pages/SettingsPage';
import SupportPage from './pages/SupportPage';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

function App() {
  const [dashboardData, setDashboardData] = useState({
    expenses: [],
    pending_tasks: [],
    monthly_report: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      marketing: [1200, 1500, 1100, 1800],
      sales: [2100, 1900, 2200, 2000],
      finance: [800, 950, 1100, 900]
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Desktop: collapsed state (persisted)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Mobile detection + mobile drawer state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ── Derived: what the sidebar + header actually see ──────────
  // On mobile  → "collapsed" means the drawer is CLOSED
  // On desktop → "collapsed" means the rail is narrow
  const isSidebarCollapsed = isMobile ? !mobileSidebarOpen : sidebarCollapsed;

  // ── Sidebar toggle called from the Header button ─────────────
  const toggleSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen(prev => !prev);
    } else {
      setSidebarCollapsed(prev => !prev);
    }
  };

  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  // ── Sync CSS variable so header left-offset tracks sidebar ───
  useEffect(() => {
    const root = document.querySelector('.app');
    if (!root) return;
    if (isMobile) {
      // header always full-width on mobile
      root.classList.remove('sidebar-collapsed');
    } else if (sidebarCollapsed) {
      root.classList.add('sidebar-collapsed');
    } else {
      root.classList.remove('sidebar-collapsed');
    }
  }, [sidebarCollapsed, isMobile]);

  // ── Persist desktop collapse preference ─────────────────────
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // ── Responsive resize handler ────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMobileSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Data fetching ────────────────────────────────────────────
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/dashboard/`);
      setDashboardData(prev => ({ ...prev, ...response.data }));
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handlePDFUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post(`${API_BASE_URL}/upload-pdf/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(`✅ PDF uploaded successfully! Found ${response.data.expenses_found} expenses.`);
      await fetchDashboardData();
    } catch (err) {
      console.error('Upload error:', err);
      alert('❌ Error uploading PDF: ' + (err.response?.data?.error || err.message));
    }
  };

  // ── Loading / Error screens ──────────────────────────────────
  if (loading && !dashboardData.expenses.length) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>⚠️ Error</h2>
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="retry-btn">
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          {/*
            .app gets class "sidebar-collapsed" when desktop sidebar is narrow.
            The CSS variable --sidebar-current reads this to shift the header.
          */}
          <div className={`app ${!isMobile && sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>

            {/* Sidebar — no longer owns the toggle button */}
            <Sidebar
              isCollapsed={isSidebarCollapsed}
              isMobile={isMobile}
              closeMobileSidebar={closeMobileSidebar}
            />

            <main className="main-content">
              {/*
                Header owns the toggle button.
                Props it needs:
                  isCollapsed        → which chevron direction to show
                  toggleSidebar      → called on desktop chevron click
                  isMobile           → switches between Menu vs Chevron icon
                  toggleMobileSidebar→ called on mobile hamburger click
              */}
              <Header
                isCollapsed={isSidebarCollapsed}
                toggleSidebar={toggleSidebar}
                isMobile={isMobile}
                toggleMobileSidebar={toggleSidebar}
              />

              <div className="content-wrapper">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={
                    <Dashboard data={dashboardData} onPDFUpload={handlePDFUpload} />
                  } />
                  <Route path="/expenses" element={
                    <ExpensesPage expenses={dashboardData.expenses} />
                  } />
                  <Route path="/trips"     element={<TripsPage />} />
                  <Route path="/approvals" element={<ApprovalsPage />} />
                  <Route path="/settings"  element={<SettingsPage />} />
                  <Route path="/support"   element={<SupportPage />} />
                </Routes>
              </div>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;