import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Download, Calendar, DollarSign,
  TrendingUp, Users, FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function MonthlyReportPage() {
  const { year, month } = useParams();
  const navigate = useNavigate();
  const { authAxios } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchReportData();
  }, [year, month]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range for the selected month
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = new Date(year, parseInt(month), 0).toISOString().split('T')[0];
      
      // Fetch expense data for the month
      const expensesResponse = await authAxios.get('/expenses/', {
        params: {
          date_from: startDate,
          date_to: endDate
        }
      });
      
      const expenses = expensesResponse.data;
      
      // Calculate summary statistics
      const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
      const expenseCount = expenses.length;
      const avgExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;
      
      // Group by category
      const categoryMap = new Map();
      expenses.forEach(exp => {
        const cat = exp.category_name || 'Other';
        const amount = parseFloat(exp.amount || 0);
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + amount);
      });
      
      const categories = Array.from(categoryMap.entries()).map(([name, amount]) => {
        const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
        return { name, amount, percentage: Math.round(percentage * 10) / 10 };
      }).sort((a, b) => b.amount - a.amount);
      
      // Group by department
      const deptMap = new Map();
      expenses.forEach(exp => {
        const dept = exp.team_name || 'Other';
        const amount = parseFloat(exp.amount || 0);
        deptMap.set(dept, {
          amount: (deptMap.get(dept)?.amount || 0) + amount,
          count: (deptMap.get(dept)?.count || 0) + 1
        });
      });
      
      const departments = Array.from(deptMap.entries()).map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count
      })).sort((a, b) => b.amount - a.amount);
      
      // Group by week (simplified)
      const weeklyData = [
        { day: 'Week 1', amount: expenses.filter(e => new Date(e.date).getDate() <= 7).reduce((s, e) => s + parseFloat(e.amount || 0), 0) },
        { day: 'Week 2', amount: expenses.filter(e => new Date(e.date).getDate() > 7 && new Date(e.date).getDate() <= 14).reduce((s, e) => s + parseFloat(e.amount || 0), 0) },
        { day: 'Week 3', amount: expenses.filter(e => new Date(e.date).getDate() > 14 && new Date(e.date).getDate() <= 21).reduce((s, e) => s + parseFloat(e.amount || 0), 0) },
        { day: 'Week 4', amount: expenses.filter(e => new Date(e.date).getDate() > 21).reduce((s, e) => s + parseFloat(e.amount || 0), 0) },
      ];
      
      // Find top category and department
      const topCategory = categories.length > 0 ? categories[0].name : 'None';
      const topDepartment = departments.length > 0 ? departments[0].name : 'None';
      
      setReportData({
        summary: {
          totalExpenses,
          expenseCount,
          avgExpense,
          topCategory,
          topDepartment
        },
        categories,
        departments,
        dailyData: weeklyData
      });
      
      setError(null);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await authAxios.post('/reports/generate/', {
        report_type: 'expense_summary',
        date_range_start: `${year}-${month.padStart(2, '0')}-01`,
        date_range_end: new Date(year, parseInt(month), 0).toISOString().split('T')[0],
        format: 'pdf'
      }, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expense-report-${year}-${month}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading report:', err);
      alert('Failed to download report. Please try again.');
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

  if (error || !reportData) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error || 'Failed to load report'}</p>
        <button onClick={fetchReportData} className="retry-btn">Retry</button>
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
          <button className="btn-primary" onClick={handleDownloadPDF}>
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

        <div className="summary-cards">
          <div className="summary-card">
            <DollarSign size={24} className="card-icon" />
            <div>
              <label>Total Expenses</label>
              <span className="amount">{formatCurrency(reportData.summary.totalExpenses)}</span>
            </div>
          </div>

          <div className="summary-card">
            <FileText size={24} className="card-icon" />
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

        <div className="charts-grid">
          <div className="chart-card">
            <h3>Expense by Category</h3>
            <div className="category-list">
              {reportData.categories.length > 0 ? (
                reportData.categories.map(cat => (
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
                ))
              ) : (
                <p className="no-data">No category data available</p>
              )}
            </div>
          </div>

          <div className="chart-card">
            <h3>Department Breakdown</h3>
            <div className="department-list">
              {reportData.departments.length > 0 ? (
                reportData.departments.map(dept => (
                  <div key={dept.name} className="department-item">
                    <div className="department-header">
                      <span>{dept.name}</span>
                      <span>{formatCurrency(dept.amount)}</span>
                    </div>
                    <div className="department-meta">
                      <span>{dept.count} expenses</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data">No department data available</p>
              )}
            </div>
          </div>

          <div className="chart-card full-width">
            <h3>Weekly Trend</h3>
            <div className="trend-chart">
              {reportData.dailyData.map((week, idx) => {
                const maxAmount = Math.max(...reportData.dailyData.map(w => w.amount));
                const barHeight = maxAmount > 0 ? (week.amount / maxAmount) * 200 : 0;
                
                return (
                  <div key={idx} className="trend-bar">
                    <div 
                      className="bar"
                      style={{ 
                        height: `${barHeight}px`,
                        backgroundColor: '#3b82f6'
                      }}
                    />
                    <span className="bar-label">{week.day}</span>
                    <span className="bar-value">{formatCurrency(week.amount)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default MonthlyReportPage;