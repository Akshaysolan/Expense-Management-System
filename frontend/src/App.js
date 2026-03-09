import React, { useState, useEffect } from 'react';
import './styles/App.css';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

function App() {
  const [dashboardData, setDashboardData] = useState({
    expenses: [],
    pending_tasks: [],
    monthly_report: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/`);
      setDashboardData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
      alert(`PDF uploaded successfully! Found ${response.data.expenses_found} expenses.`);
      fetchDashboardData(); 
    } catch (error) {
      alert('Error uploading PDF: ' + error.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <Dashboard 
          data={dashboardData} 
          onPDFUpload={handlePDFUpload}
        />
      </div>
    </div>
  );
}

export default App;