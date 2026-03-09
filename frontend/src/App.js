// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/dashboard/`);
      setDashboardData(prevData => ({
        ...prevData,
        ...response.data
      }));
      setError(null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert(`✅ PDF uploaded successfully! Found ${response.data.expenses_found} expenses.`);
      await fetchDashboardData();
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Error uploading PDF: ' + (error.response?.data?.error || error.message));
    }
  };

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
          <div className="app">
            <Sidebar 
              collapsed={sidebarCollapsed} 
              toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={
                  <Dashboard 
                    data={dashboardData} 
                    onPDFUpload={handlePDFUpload}
                  />
                } />
                <Route path="/expenses" element={
                  <ExpensesPage 
                    expenses={dashboardData.expenses}
                  />
                } />
                <Route path="/trips" element={<TripsPage />} />
                <Route path="/approvals" element={<ApprovalsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/support" element={<SupportPage />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;