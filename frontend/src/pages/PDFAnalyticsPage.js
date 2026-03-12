// frontend/src/pages/PDFAnalyticsPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Download,
  ArrowLeft, Calendar, DollarSign, FileText,
  Tag, Clock, Loader, AlertCircle,
  ChevronRight, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell,
  LineChart, Line,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';


const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#6b7280',
];

function PDFAnalyticsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authAxios } = useAuth();

  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [pdfData, setPdfData]     = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [chartType, setChartType] = useState('bar');

  useEffect(() => {
    if (id) {
      fetchPDFAnalytics();
    } else {
      fetchAllPDFHistory();
    }
  }, [id]);

  /* ─── Data Fetching ─── */

  const fetchPDFAnalytics = async () => {
    try {
      setLoading(true);
      const response = await authAxios.get(`/pdf-analytics/${id}/`);
      setPdfData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch PDF analytics');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPDFHistory = async () => {
    try {
      setLoading(true);
      const response = await authAxios.get('/pdf-history/');
      setPdfData({ history: response.data });
      setError(null);
    } catch (err) {
      setError('Failed to fetch PDF history');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (id) fetchPDFAnalytics();
    else fetchAllPDFHistory();
  };

  /* ─── Helpers ─── */

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div className="pdf-analytics-loading">
        <Loader className="spinner" size={40} />
        <p>Loading PDF analytics...</p>
      </div>
    );
  }

  /* ─── Error State ─── */
  if (error) {
    return (
      <div className="pdf-analytics-error">
        <AlertCircle className="error-icon" size={48} />
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <button className="retry-btn" onClick={handleRefresh}>
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  /* ─── History View (no specific PDF ID) ─── */
  if (!id && pdfData?.history) {
    return (
      <div className="pdf-history-page">
        <div className="history-header">
          <div className="history-title">
            <h1>PDF Upload History</h1>
            <p>View analytics from all your uploaded PDFs</p>
          </div>
          <button className="refresh-btn" onClick={handleRefresh}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {pdfData.history.length > 0 ? (
          <div className="history-grid">
            {pdfData.history.map((pdf) => (
              <motion.div
                key={pdf.id}
                className="history-card"
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate(`/pdf-analytics/${pdf.id}`)}
              >
                <div className="card-header">
                  <div className="pdf-icon">
                    <FileText size={24} />
                  </div>
                  <div className="card-info">
                    <h3>{pdf.filename || `PDF Upload ${pdf.id}`}</h3>
                    <p>Processed: {pdf.expenses_found} expenses found</p>
                  </div>
                </div>

                <div className="stats-preview">
                  <div className="stat-item">
                    <div className="stat-value">{pdf.expenses_found}</div>
                    <div className="stat-label">Expenses</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">
                      {formatCurrency(pdf.total_amount || 0)}
                    </div>
                    <div className="stat-label">Total</div>
                  </div>
                </div>

                <div className="card-footer">
                  <span className="date-badge">
                    <Calendar size={12} />
                    {new Date(pdf.uploaded_at).toLocaleDateString()}
                  </span>
                  <button className="view-btn">
                    View Analytics
                    <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
            <h3>No PDFs uploaded yet</h3>
            <p>Upload a PDF from the dashboard to see analytics here</p>
          </div>
        )}
      </div>
    );
  }

  /* ─── Analytics Detail View ─── */
  return (
    <div className="pdf-analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <button className="back-btn" onClick={() => navigate('/pdf-analytics')}>
          <ArrowLeft size={16} />
          Back to History
        </button>

        <div className="pdf-title">
          <h1>PDF Analytics</h1>
          <span className="pdf-badge">ID: {id?.slice(0, 8)}...</span>
        </div>

        <button className="refresh-btn" onClick={handleRefresh}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="analytics-tabs">
        {['overview', 'expenses', 'trends'].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe', color: '#1e40af' }}>
            <FileText size={22} />
          </div>
          <div className="stat-content">
            <h3>Total Expenses</h3>
            <p>{pdfData?.expenses?.length || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#d1fae5', color: '#065f46' }}>
            <DollarSign size={22} />
          </div>
          <div className="stat-content">
            <h3>Total Amount</h3>
            <p>{formatCurrency(pdfData?.total_amount || 0)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fee2e2', color: '#991b1b' }}>
            <Tag size={22} />
          </div>
          <div className="stat-content">
            <h3>Categories</h3>
            <p>{pdfData?.unique_categories || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#92400e' }}>
            <Clock size={22} />
          </div>
          <div className="stat-content">
            <h3>Upload Date</h3>
            <p>
              {pdfData?.uploaded_at
                ? new Date(pdfData.uploaded_at).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="chart-container">
        <div className="chart-header">
          <div className="chart-title">
            <BarChart3 size={20} />
            <span>Expense Analysis</span>
          </div>
          <div className="chart-controls">
            {['bar', 'pie', 'line'].map((type) => (
              <button
                key={type}
                className={`chart-control-btn ${chartType === type ? 'active' : ''}`}
                onClick={() => setChartType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={pdfData?.category_breakdown || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : chartType === 'pie' ? (
              <RePieChart>
                <Pie
                  data={pdfData?.category_breakdown || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, amount }) => `${name}: ${formatCurrency(amount)}`}
                  outerRadius={150}
                  dataKey="amount"
                >
                  {(pdfData?.category_breakdown || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </RePieChart>
            ) : (
              <LineChart data={pdfData?.monthly_trends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#3b82f6' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="expenses-table">
        <div className="table-header">
          <div className="table-title">
            <FileText size={20} />
            <span>Extracted Expenses</span>
          </div>
          <button className="export-btn">
            <Download size={15} />
            Export CSV
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pdfData?.expenses?.map((expense, index) => (
                <tr key={index}>
                  <td>{new Date(expense.date).toLocaleDateString()}</td>
                  <td>{expense.description || expense.subject}</td>
                  <td>{expense.category || 'Uncategorized'}</td>
                  <td>{formatCurrency(expense.amount)}</td>
                  <td>
                    <span className={`status-badge status-${(expense.status || 'pending').toLowerCase()}`}>
                      {expense.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PDFAnalyticsPage;