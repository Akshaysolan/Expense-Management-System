import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Download, Calendar, FileText, PieChart,
  BarChart3, TrendingUp, Filter, ChevronRight,
  Loader, AlertCircle
} from 'lucide-react';
import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function ReportsPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('month');
  const [reportType, setReportType] = useState('expense');
  const [loading, setLoading] = useState(false);
  const [recentReports, setRecentReports] = useState([]);
  const [error, setError] = useState(null);
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });

  const reports = [
    {
      id: 1,
      title: 'Monthly Expense Summary',
      description: 'Overview of all expenses for the selected month',
      icon: BarChart3,
      color: '#3b82f6',
      type: 'expense_summary',
      path: '/reports/monthly'
    },
    {
      id: 2,
      title: 'Department Spending',
      description: 'Expense breakdown by department and team',
      icon: PieChart,
      color: '#10b981',
      type: 'department_spending',
      path: '/reports/departments'
    },
    {
      id: 3,
      title: 'Travel Reports',
      description: 'Trip expenses and travel analytics',
      icon: TrendingUp,
      color: '#f59e0b',
      type: 'travel_report',
      path: '/reports/travel'
    },
    {
      id: 4,
      title: 'Category Analysis',
      description: 'Expense distribution by category',
      icon: PieChart,
      color: '#8b5cf6',
      type: 'category_analysis',
      path: '/reports/categories'
    },
    {
      id: 5,
      title: 'Employee Expenses',
      description: 'Individual employee spending analysis',
      icon: FileText,
      color: '#ec4899',
      type: 'employee_expenses',
      path: '/reports/employees'
    },
    {
      id: 6,
      title: 'Yearly Comparison',
      description: 'Year-over-year expense trends',
      icon: BarChart3,
      color: '#14b8a6',
      type: 'yearly_comparison',
      path: '/reports/yearly'
    }
  ];

  const quickReports = [
    { label: 'This Month', value: 'month', days: 30 },
    { label: 'Last Month', value: 'last-month', days: 30, offset: 30 },
    { label: 'This Quarter', value: 'quarter', days: 90 },
    { label: 'This Year', value: 'year', days: 365 },
    { label: 'Custom Range', value: 'custom' }
  ];

  useEffect(() => {
    fetchRecentReports();
  }, []);

  const fetchRecentReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/recent/');
      setRecentReports(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch recent reports');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeFromValue = (rangeValue) => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (rangeValue) {
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'last-month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1);
        endDate = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        break;
      default:
        return customDateRange;
    }

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  const handleGenerateReport = async (report) => {
    try {
      setLoading(true);
      const dateRange_ = getDateRangeFromValue(dateRange);
      
      const response = await api.post('/reports/generate/', {
        report_type: report.type,
        date_range_start: dateRange_.start,
        date_range_end: dateRange_.end,
        format: 'pdf',
        filters: {}
      });

      // Refresh recent reports
      await fetchRecentReports();
      
      // Show success message
      alert('Report generated successfully!');
      
    } catch (err) {
      setError('Failed to generate report');
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (reportId) => {
    try {
      const response = await api.get(`/reports/download/${reportId}/`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (err) {
      setError('Failed to download report');
      console.error('Error downloading report:', err);
    }
  };

  const handleApplyFilters = () => {
    // Refresh data with new filters
    fetchRecentReports();
  };

  // Styles
  const styles = {
    page: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    pageHeader: {
      marginBottom: '2rem'
    },
    pageHeaderH1: {
      fontSize: '2rem',
      color: '#1a1a1a',
      marginBottom: '0.5rem',
      fontWeight: '600'
    },
    subtitle: {
      color: '#666',
      fontSize: '1rem'
    },
    filters: {
      background: 'white',
      padding: '1.5rem',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      marginBottom: '2rem'
    },
    filterGroup: {
      marginBottom: '1rem'
    },
    filterLabel: {
      display: 'block',
      fontWeight: '500',
      color: '#4a5568',
      marginBottom: '0.5rem'
    },
    filterButtons: {
      display: 'flex',
      gap: '0.5rem',
      flexWrap: 'wrap'
    },
    filterBtn: {
      padding: '0.5rem 1rem',
      border: '1px solid #e2e8f0',
      background: 'white',
      borderRadius: '20px',
      fontSize: '0.875rem',
      color: '#4a5568',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    filterBtnActive: {
      background: '#3b82f6',
      color: 'white',
      borderColor: '#3b82f6'
    },
    customDateRange: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      margin: '1rem 0'
    },
    dateInput: {
      padding: '0.5rem',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '0.875rem'
    },
    generateBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.5rem',
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background 0.2s'
    },
    generateBtnDisabled: {
      opacity: 0.7,
      cursor: 'not-allowed'
    },
    reportsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    },
    reportCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      cursor: 'pointer',
      transition: 'box-shadow 0.2s'
    },
    reportIcon: {
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '1rem'
    },
    reportContentH3: {
      fontSize: '1.125rem',
      color: '#1a1a1a',
      marginBottom: '0.5rem',
      fontWeight: '600'
    },
    reportContentP: {
      color: '#666',
      fontSize: '0.875rem',
      lineHeight: '1.5',
      margin: 0
    },
    reportFooter: {
      marginTop: '1rem',
      paddingTop: '1rem',
      borderTop: '1px solid #e2e8f0'
    },
    viewReportBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      padding: '0.5rem',
      background: 'none',
      border: 'none',
      color: '#3b82f6',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'color 0.2s'
    },
    viewReportBtnDisabled: {
      color: '#a0aec0',
      cursor: 'not-allowed'
    },
    savedReports: {
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
    },
    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '1.5rem'
    },
    sectionHeaderH2: {
      fontSize: '1.25rem',
      color: '#1a1a1a',
      fontWeight: '600',
      margin: 0
    },
    viewAll: {
      padding: '0.5rem 1rem',
      background: 'none',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      color: '#4a5568',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    savedReportsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    },
    savedReportItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '1rem',
      background: '#f9fafc',
      borderRadius: '8px',
      transition: 'background 0.2s'
    },
    savedReportItemIcon: {
      width: '40px',
      height: '40px',
      minWidth: '40px',
      background: '#e2e8f0',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#4a5568'
    },
    reportInfo: {
      flex: 1
    },
    reportInfoH4: {
      fontSize: '1rem',
      color: '#1a1a1a',
      marginBottom: '0.25rem',
      fontWeight: '500',
      margin: 0
    },
    reportInfoP: {
      fontSize: '0.875rem',
      color: '#666',
      margin: 0
    },
    downloadBtn: {
      padding: '0.5rem',
      background: 'none',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      color: '#4a5568',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    noReports: {
      textAlign: 'center',
      color: '#666',
      padding: '2rem',
      margin: 0
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      color: '#666'
    },
    spinner: {
      animation: 'spin 1s linear infinite',
      marginBottom: '1rem'
    },
    errorMessage: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '1rem',
      background: '#fee2e2',
      border: '1px solid #fecaca',
      borderRadius: '8px',
      color: '#dc2626',
      marginBottom: '1rem',
      position: 'relative'
    },
    errorCloseBtn: {
      position: 'absolute',
      right: '1rem',
      background: 'none',
      border: 'none',
      color: '#dc2626',
      fontSize: '1.25rem',
      cursor: 'pointer'
    }
  };

  // Add keyframes for spinner animation
  const spinnerAnimation = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  // Add style tag for animations
  const styleTag = document.createElement('style');
  styleTag.textContent = spinnerAnimation;
  document.head.appendChild(styleTag);

  if (loading && recentReports.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <Loader style={styles.spinner} size={40} />
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageHeaderH1}>Reports & Analytics</h1>
        <p style={styles.subtitle}>Generate and download expense reports</p>
      </div>

      {error && (
        <div style={styles.errorMessage}>
          <AlertCircle size={20} />
          <span>{error}</span>
          <button style={styles.errorCloseBtn} onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Quick Filters */}
      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Date Range</label>
          <div style={styles.filterButtons}>
            {quickReports.map(range => (
              <button
                key={range.value}
                style={{
                  ...styles.filterBtn,
                  ...(dateRange === range.value ? styles.filterBtnActive : {})
                }}
                onClick={() => setDateRange(range.value)}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {dateRange === 'custom' && (
          <div style={styles.customDateRange}>
            <input
              type="date"
              value={customDateRange.start}
              onChange={(e) => setCustomDateRange({...customDateRange, start: e.target.value})}
              style={styles.dateInput}
            />
            <span>to</span>
            <input
              type="date"
              value={customDateRange.end}
              onChange={(e) => setCustomDateRange({...customDateRange, end: e.target.value})}
              style={styles.dateInput}
            />
          </div>
        )}

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Report Type</label>
          <div style={styles.filterButtons}>
            <button
              style={{
                ...styles.filterBtn,
                ...(reportType === 'expense' ? styles.filterBtnActive : {})
              }}
              onClick={() => setReportType('expense')}
            >
              Expense Reports
            </button>
            <button
              style={{
                ...styles.filterBtn,
                ...(reportType === 'trip' ? styles.filterBtnActive : {})
              }}
              onClick={() => setReportType('trip')}
            >
              Trip Reports
            </button>
          </div>
        </div>

        <button 
          style={{
            ...styles.generateBtn,
            ...(loading ? styles.generateBtnDisabled : {})
          }} 
          onClick={handleApplyFilters} 
          disabled={loading}
        >
          {loading ? <Loader size={16} style={styles.spinner} /> : <Filter size={16} />}
          Apply Filters
        </button>
      </div>

      {/* Reports Grid */}
      <div style={styles.reportsGrid}>
        {reports
          .filter(report => {
            if (reportType === 'expense') {
              return !report.type.includes('travel');
            } else {
              return report.type.includes('travel');
            }
          })
          .map(report => (
            <motion.div
              key={report.id}
              style={styles.reportCard}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div style={{...styles.reportIcon, backgroundColor: `${report.color}20`}}>
                <report.icon color={report.color} size={24} />
              </div>
              
              <div style={styles.reportContent}>
                <h3 style={styles.reportContentH3}>{report.title}</h3>
                <p style={styles.reportContentP}>{report.description}</p>
              </div>

              <div style={styles.reportFooter}>
                <button 
                  style={{
                    ...styles.viewReportBtn,
                    ...(loading ? styles.viewReportBtnDisabled : {})
                  }}
                  onClick={() => handleGenerateReport(report)}
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Generate Report'}
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          ))}
      </div>

      {/* Saved Reports */}
      <div style={styles.savedReports}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionHeaderH2}>Recently Generated Reports</h2>
          <button style={styles.viewAll} onClick={fetchRecentReports}>Refresh</button>
        </div>

        <div style={styles.savedReportsList}>
          {recentReports.length > 0 ? (
            recentReports.map(report => (
              <div key={report.id} style={styles.savedReportItem}>
                <div style={styles.savedReportItemIcon}>
                  <FileText size={20} />
                </div>
                <div style={styles.reportInfo}>
                  <h4 style={styles.reportInfoH4}>{report.title}</h4>
                  <p style={styles.reportInfoP}>
                    Generated on {new Date(report.created_at).toLocaleDateString()} 
                    {report.date_range_start && ` • ${report.date_range_start} to ${report.date_range_end}`}
                  </p>
                </div>
                <button 
                  style={styles.downloadBtn}
                  onClick={() => handleDownloadReport(report.report_id)}
                  title="Download Report"
                >
                  <Download size={16} />
                </button>
              </div>
            ))
          ) : (
            <p style={styles.noReports}>No reports generated yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;