// frontend/src/pages/MonthlyReportPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Download, Calendar, DollarSign,
  TrendingUp, Users, PieChart, BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function MonthlyReportPage() {
  const { year, month } = useParams();
  const navigate = useNavigate();
  const { authAxios } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchReportData();
  }, [year, month]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      setReportData({
        summary: {
          totalExpenses: 45678.90,
          expenseCount: 324,
          avgExpense: 141.00,
          topCategory: 'Travel',
          topDepartment: 'Sales'
        },
        categories: [
          { name: 'Travel', amount: 15234.50, percentage: 33.4 },
          { name: 'Meals', amount: 8765.40, percentage: 19.2 },
          { name: 'Office', amount: 6543.20, percentage: 14.3 },
          { name: 'Software', amount: 5432.10, percentage: 11.9 },
          { name: 'Hotels', amount: 4321.80, percentage: 9.5 },
          { name: 'Other', amount: 5381.90, percentage: 11.7 }
        ],
        departments: [
          { name: 'Sales', amount: 15678.50, count: 98 },
          { name: 'Marketing', amount: 12345.60, count: 76 },
          { name: 'IT', amount: 8765.40, count: 54 },
          { name: 'Finance', amount: 6543.20, count: 42 },
          { name: 'HR', amount: 2345.20, count: 54 }
        ],
        dailyData: [
          { day: 'Week 1', amount: 8765 },
          { day: 'Week 2', amount: 11234 },
          { day: 'Week 3', amount: 9876 },
          { day: 'Week 4', amount: 15803 }
        ]
      });
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const formatCurrency = (amount) => {
    return `€${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Generating report...</p>
      </div>
    );
  }

  return (
    <div className="report-page">
      <div className="report-header">
        <button className="back-button" onClick={() => navigate('/reports')}>
          <ArrowLeft size={20} />
          <span>Back to Reports</span>
        </button>

        <div className="header-actions">
          <button className="btn-secondary">
            <Calendar size={16} />
            {monthNames[parseInt(month) - 1]} {year}
          </button>
          <button className="btn-primary">
            <Download size={16} />
            Download PDF
          </button>
        </div>
      </div>

      <motion.div 
        className="report-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h1 className="report-title">
          Expense Report: {monthNames[parseInt(month) - 1]} {year}
        </h1>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <DollarSign size={24} className="card-icon" />
            <div>
              <label>Total Expenses</label>
              <span className="amount">{formatCurrency(reportData.summary.totalExpenses)}</span>
            </div>
          </div>

          <div className="summary-card">
            <BarChart3 size={24} className="card-icon" />
            <div>
              <label>Expense Count</label>
              <span className="count">{reportData.summary.expenseCount}</span>
            </div>
          </div>

          <div className="summary-card">
            <TrendingUp size={24} className="card-icon" />
            <div>
              <label>Average Expense</label>
              <span className="amount">{formatCurrency(reportData.summary.avgExpense)}</span>
            </div>
          </div>

          <div className="summary-card">
            <Users size={24} className="card-icon" />
            <div>
              <label>Top Department</label>
              <span>{reportData.summary.topDepartment}</span>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Expense by Category</h3>
            <div className="category-list">
              {reportData.categories.map(cat => (
                <div key={cat.name} className="category-item">
                  <div className="category-header">
                    <span>{cat.name}</span>
                    <span className="category-amount">{formatCurrency(cat.amount)}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                  <span className="category-percentage">{cat.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <h3>Department Breakdown</h3>
            <div className="department-list">
              {reportData.departments.map(dept => (
                <div key={dept.name} className="department-item">
                  <div className="department-header">
                    <span>{dept.name}</span>
                    <span>{formatCurrency(dept.amount)}</span>
                  </div>
                  <div className="department-meta">
                    <span>{dept.count} expenses</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card full-width">
            <h3>Weekly Trend</h3>
            <div className="trend-chart">
              {reportData.dailyData.map((week, idx) => (
                <div key={idx} className="trend-bar">
                  <div 
                    className="bar"
                    style={{ 
                      height: `${(week.amount / reportData.summary.totalExpenses) * 300}px`,
                      backgroundColor: '#3b82f6'
                    }}
                  />
                  <span className="bar-label">{week.day}</span>
                  <span className="bar-value">{formatCurrency(week.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default MonthlyReportPage;