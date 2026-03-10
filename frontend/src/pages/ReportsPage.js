// frontend/src/pages/ReportsPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Download, Calendar, FileText, PieChart,
  BarChart3, TrendingUp, Filter, ChevronRight
} from 'lucide-react';

function ReportsPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('month');
  const [reportType, setReportType] = useState('expense');

  const reports = [
    {
      id: 1,
      title: 'Monthly Expense Summary',
      description: 'Overview of all expenses for the selected month',
      icon: BarChart3,
      color: '#3b82f6',
      path: '/reports/monthly/2026/03'
    },
    {
      id: 2,
      title: 'Department Spending',
      description: 'Expense breakdown by department and team',
      icon: PieChart,
      color: '#10b981',
      path: '/reports/departments'
    },
    {
      id: 3,
      title: 'Travel Reports',
      description: 'Trip expenses and travel analytics',
      icon: TrendingUp,
      color: '#f59e0b',
      path: '/reports/travel'
    },
    {
      id: 4,
      title: 'Category Analysis',
      description: 'Expense distribution by category',
      icon: PieChart,
      color: '#8b5cf6',
      path: '/reports/categories'
    },
    {
      id: 5,
      title: 'Employee Expenses',
      description: 'Individual employee spending analysis',
      icon: FileText,
      color: '#ec4899',
      path: '/reports/employees'
    },
    {
      id: 6,
      title: 'Yearly Comparison',
      description: 'Year-over-year expense trends',
      icon: BarChart3,
      color: '#14b8a6',
      path: '/reports/yearly'
    }
  ];

  const quickReports = [
    { label: 'This Month', value: 'month' },
    { label: 'Last Month', value: 'last-month' },
    { label: 'This Quarter', value: 'quarter' },
    { label: 'This Year', value: 'year' },
    { label: 'Custom Range', value: 'custom' }
  ];

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <p className="subtitle">Generate and download expense reports</p>
      </div>

      {/* Quick Filters */}
      <div className="reports-filters">
        <div className="filter-group">
          <label>Date Range</label>
          <div className="filter-buttons">
            {quickReports.map(range => (
              <button
                key={range.value}
                className={`filter-btn ${dateRange === range.value ? 'active' : ''}`}
                onClick={() => setDateRange(range.value)}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Report Type</label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${reportType === 'expense' ? 'active' : ''}`}
              onClick={() => setReportType('expense')}
            >
              Expense Reports
            </button>
            <button
              className={`filter-btn ${reportType === 'trip' ? 'active' : ''}`}
              onClick={() => setReportType('trip')}
            >
              Trip Reports
            </button>
          </div>
        </div>

        <button className="generate-btn">
          <Filter size={16} />
          Apply Filters
        </button>
      </div>

      {/* Reports Grid */}
      <div className="reports-grid">
        {reports.map(report => (
          <motion.div
            key={report.id}
            className="report-card"
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 300 }}
            onClick={() => navigate(report.path)}
          >
            <div className="report-icon" style={{ backgroundColor: `${report.color}20` }}>
              <report.icon color={report.color} size={24} />
            </div>
            
            <div className="report-content">
              <h3>{report.title}</h3>
              <p>{report.description}</p>
            </div>

            <div className="report-footer">
              <button className="view-report-btn">
                Generate Report
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Saved Reports */}
      <div className="saved-reports">
        <div className="section-header">
          <h2>Recently Generated Reports</h2>
          <button className="view-all">View All</button>
        </div>

        <div className="saved-reports-list">
          {[1, 2, 3].map(i => (
            <div key={i} className="saved-report-item">
              <FileText size={20} className="report-icon" />
              <div className="report-info">
                <h4>Monthly Expense Report - March 2026</h4>
                <p>Generated on April 1, 2026 • 245 expenses</p>
              </div>
              <button className="download-btn">
                <Download size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;