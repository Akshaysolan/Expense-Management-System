// frontend/src/pages/ReportsPage.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download, FileText, PieChart,
  BarChart3, TrendingUp, Filter, ChevronRight,
  Loader, AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';


const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';


const REPORT_CARDS = [
  {
    id: 1,
    title: 'Monthly Expense Summary',
    description: 'Overview of all expenses for the selected month',
    icon: BarChart3,
    color: '#3b82f6',
    type: 'expense_summary',
  },
  {
    id: 2,
    title: 'Department Spending',
    description: 'Expense breakdown by department and team',
    icon: PieChart,
    color: '#10b981',
    type: 'department_spending',
  },
  {
    id: 3,
    title: 'Travel Reports',
    description: 'Trip expenses and travel analytics',
    icon: TrendingUp,
    color: '#f59e0b',
    type: 'travel_report',
  },
  {
    id: 4,
    title: 'Category Analysis',
    description: 'Expense distribution by category',
    icon: PieChart,
    color: '#8b5cf6',
    type: 'category_analysis',
  },
  {
    id: 5,
    title: 'Employee Expenses',
    description: 'Individual employee spending analysis',
    icon: FileText,
    color: '#ec4899',
    type: 'employee_expenses',
  },
  {
    id: 6,
    title: 'Yearly Comparison',
    description: 'Year-over-year expense trends',
    icon: BarChart3,
    color: '#14b8a6',
    type: 'yearly_comparison',
  },
];

const QUICK_RANGES = [
  { label: 'This Month',  value: 'month'      },
  { label: 'Last Month',  value: 'last-month' },
  { label: 'This Quarter', value: 'quarter'    },
  { label: 'This Year',   value: 'year'       },
  { label: 'Custom Range', value: 'custom'     },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDateRange(rangeValue, customRange) {
  const today = new Date();

  switch (rangeValue) {
    case 'month': {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      const e = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { start: s.toISOString().split('T')[0], end: e.toISOString().split('T')[0] };
    }
    case 'last-month': {
      const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const e = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: s.toISOString().split('T')[0], end: e.toISOString().split('T')[0] };
    }
    case 'quarter': {
      const q = Math.floor(today.getMonth() / 3);
      const s = new Date(today.getFullYear(), q * 3, 1);
      const e = new Date(today.getFullYear(), (q + 1) * 3, 0);
      return { start: s.toISOString().split('T')[0], end: e.toISOString().split('T')[0] };
    }
    case 'year': {
      return {
        start: `${today.getFullYear()}-01-01`,
        end:   `${today.getFullYear()}-12-31`,
      };
    }
    default:
      return customRange;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
function ReportsPage() {
  const { authAxios } = useAuth(); // Use the shared axios instance from AuthContext
  
  const [dateRange,       setDateRange]       = useState('month');
  const [reportType,      setReportType]      = useState('expense');
  const [loading,         setLoading]         = useState(false);
  const [generating,      setGenerating]      = useState(null); // card id being generated
  const [recentReports,   setRecentReports]   = useState([]);
  const [error,           setError]           = useState(null);
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchRecentReports();
  }, []);

  // ── API calls ──────────────────────────────────────────────────────────────

  const fetchRecentReports = async () => {
    try {
      setLoading(true);
      const response = await authAxios.get('/reports/recent/');
      setRecentReports(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch recent reports');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (card) => {
    try {
      setGenerating(card.id);
      const range = getDateRange(dateRange, customDateRange);

      await authAxios.post('/reports/generate/', {
        report_type:      card.type,
        date_range_start: range.start,
        date_range_end:   range.end,
        format:           'pdf',
        filters:          {},
      });

      await fetchRecentReports();
    } catch (err) {
      setError('Failed to generate report');
      console.error('Error generating report:', err);
    } finally {
      setGenerating(null);
    }
  };

  const handleDownloadReport = async (reportId) => {
    try {
      const response = await authAxios.get(`/reports/download/${reportId}/`, {
        responseType: 'blob',
      });

      const url  = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `report_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download report');
      console.error('Error downloading report:', err);
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────

  const visibleCards = REPORT_CARDS.filter((card) =>
    reportType === 'expense'
      ? !card.type.includes('travel')
      : card.type.includes('travel')
  );

  // ── Styles ─────────────────────────────────────────────────────────────────
  const styles = {
    page:            { maxWidth: '1400px', margin: '0 auto', padding: '2rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    pageHeaderH1:    { fontSize: '2rem', color: '#1a1a1a', marginBottom: '0.5rem', fontWeight: '600' },
    subtitle:        { color: '#666', fontSize: '1rem' },
    filters:         { background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '2rem' },
    filterLabel:     { display: 'block', fontWeight: '500', color: '#4a5568', marginBottom: '0.5rem' },
    filterButtons:   { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
    filterBtn:       { padding: '0.5rem 1rem', border: '1px solid #e2e8f0', background: 'white', borderRadius: '20px', fontSize: '0.875rem', color: '#4a5568', cursor: 'pointer' },
    filterBtnActive: { background: '#3b82f6', color: 'white', borderColor: '#3b82f6' },
    customDateRange: { display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0' },
    dateInput:       { padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem' },
    applyBtn:        { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', marginTop: '1rem' },
    reportsGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
    reportCard:      { background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' },
    reportIcon:      { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' },
    reportH3:        { fontSize: '1.125rem', color: '#1a1a1a', marginBottom: '0.5rem', fontWeight: '600' },
    reportP:         { color: '#666', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 },
    reportFooter:    { marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' },
    viewBtn:         { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0.5rem', background: 'none', border: 'none', color: '#3b82f6', fontWeight: '500', cursor: 'pointer' },
    savedSection:    { background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
    sectionHeader:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' },
    sectionH2:       { fontSize: '1.25rem', color: '#1a1a1a', fontWeight: '600', margin: 0 },
    refreshBtn:      { padding: '0.5rem 1rem', background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#4a5568', cursor: 'pointer' },
    reportItem:      { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f9fafc', borderRadius: '8px', marginBottom: '0.75rem' },
    reportItemIcon:  { width: '40px', height: '40px', minWidth: '40px', background: '#e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5568' },
    reportInfo:      { flex: 1 },
    reportInfoH4:    { fontSize: '1rem', color: '#1a1a1a', fontWeight: '500', margin: '0 0 0.25rem 0' },
    reportInfoP:     { fontSize: '0.875rem', color: '#666', margin: 0 },
    downloadBtn:     { padding: '0.5rem', background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#4a5568', cursor: 'pointer' },
    noReports:       { textAlign: 'center', color: '#666', padding: '2rem' },
    errorMsg:        { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', marginBottom: '1rem', position: 'relative' },
    errorClose:      { position: 'absolute', right: '1rem', background: 'none', border: 'none', color: '#dc2626', fontSize: '1.25rem', cursor: 'pointer' },
    spinner:         { animation: 'spin 1s linear infinite' },
    loadingWrap:     { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: '#666' },
  };

  if (loading && recentReports.length === 0) {
    return (
      <div style={styles.loadingWrap}>
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        <Loader style={styles.spinner} size={40} />
        <p>Loading reports…</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={styles.pageHeaderH1}>Reports &amp; Analytics</h1>
        <p style={styles.subtitle}>Generate and download expense reports</p>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorMsg}>
          <AlertCircle size={20} />
          <span>{error}</span>
          <button style={styles.errorClose} onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Filters */}
      <div style={styles.filters}>
        {/* Date range */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={styles.filterLabel}>Date Range</label>
          <div style={styles.filterButtons}>
            {QUICK_RANGES.map((r) => (
              <button
                key={r.value}
                style={{ ...styles.filterBtn, ...(dateRange === r.value ? styles.filterBtnActive : {}) }}
                onClick={() => setDateRange(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {dateRange === 'custom' && (
          <div style={styles.customDateRange}>
            <input
              type="date"
              value={customDateRange.start}
              onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
              style={styles.dateInput}
            />
            <span>to</span>
            <input
              type="date"
              value={customDateRange.end}
              onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
              style={styles.dateInput}
            />
          </div>
        )}

        {/* Report type */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={styles.filterLabel}>Report Type</label>
          <div style={styles.filterButtons}>
            {[{ label: 'Expense Reports', value: 'expense' }, { label: 'Trip Reports', value: 'trip' }].map((t) => (
              <button
                key={t.value}
                style={{ ...styles.filterBtn, ...(reportType === t.value ? styles.filterBtnActive : {}) }}
                onClick={() => setReportType(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <button style={styles.applyBtn} onClick={fetchRecentReports} disabled={loading}>
          {loading ? <Loader size={16} style={styles.spinner} /> : <Filter size={16} />}
          Apply Filters
        </button>
      </div>

      {/* Report Cards */}
      <div style={styles.reportsGrid}>
        {visibleCards.map((card) => {
          const isGenerating = generating === card.id;
          return (
            <motion.div
              key={card.id}
              style={styles.reportCard}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div style={{ ...styles.reportIcon, backgroundColor: `${card.color}20` }}>
                <card.icon color={card.color} size={24} />
              </div>
              <h3 style={styles.reportH3}>{card.title}</h3>
              <p style={styles.reportP}>{card.description}</p>
              <div style={styles.reportFooter}>
                <button
                  style={{ ...styles.viewBtn, ...(isGenerating ? { color: '#a0aec0', cursor: 'not-allowed' } : {}) }}
                  onClick={() => handleGenerateReport(card)}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <><Loader size={14} style={styles.spinner} /> Generating…</>
                  ) : (
                    <>Generate Report <ChevronRight size={16} /></>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recently Generated Reports */}
      <div style={styles.savedSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionH2}>Recently Generated Reports</h2>
          <button style={styles.refreshBtn} onClick={fetchRecentReports} disabled={loading}>
            {loading ? <Loader size={14} style={styles.spinner} /> : 'Refresh'}
          </button>
        </div>

        {recentReports.length > 0 ? (
          recentReports.map((report) => (
            <div key={report.id} style={styles.reportItem}>
              <div style={styles.reportItemIcon}>
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
  );
}

export default ReportsPage;