// frontend/src/pages/ReportsPage.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, FileText, PieChart,
  BarChart3, TrendingUp, Filter,
  ChevronRight, Loader, AlertCircle,
  RefreshCw, Calendar, Clock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';


// ─── Static data ──────────────────────────────────────────────────────────────
const REPORT_CARDS = [
  {
    id:          1,
    title:       'Monthly Expense Summary',
    description: 'Overview of all expenses for the selected month',
    icon:        BarChart3,
    colorKey:    'blue',
    type:        'expense_summary',
  },
  {
    id:          2,
    title:       'Department Spending',
    description: 'Expense breakdown by department and team',
    icon:        PieChart,
    colorKey:    'green',
    type:        'department_spending',
  },
  {
    id:          3,
    title:       'Travel Reports',
    description: 'Trip expenses and travel analytics',
    icon:        TrendingUp,
    colorKey:    'amber',
    type:        'travel_report',
  },
  {
    id:          4,
    title:       'Category Analysis',
    description: 'Expense distribution by category',
    icon:        PieChart,
    colorKey:    'violet',
    type:        'category_analysis',
  },
  {
    id:          5,
    title:       'Employee Expenses',
    description: 'Individual employee spending analysis',
    icon:        FileText,
    colorKey:    'pink',
    type:        'employee_expenses',
  },
  {
    id:          6,
    title:       'Yearly Comparison',
    description: 'Year-over-year expense trends',
    icon:        BarChart3,
    colorKey:    'teal',
    type:        'yearly_comparison',
  },
];

const QUICK_RANGES = [
  { label: 'This Month',   value: 'month'      },
  { label: 'Last Month',   value: 'last-month' },
  { label: 'This Quarter', value: 'quarter'    },
  { label: 'This Year',    value: 'year'       },
  { label: 'Custom Range', value: 'custom'     },
];

const REPORT_TYPES = [
  { label: 'Expense Reports', value: 'expense' },
  { label: 'Trip Reports',    value: 'trip'    },
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
    case 'year':
      return {
        start: `${today.getFullYear()}-01-01`,
        end:   `${today.getFullYear()}-12-31`,
      };
    default:
      return customRange;
  }
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReportCard({ card, isGenerating, onGenerate }) {
  const Icon = card.icon;

  return (
    <motion.article
      className={`rp-card rp-card--${card.colorKey}`}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      aria-label={`${card.title} report card`}
    >
      <div className="rp-card__icon-wrap" aria-hidden="true">
        <Icon size={22} strokeWidth={2} />
      </div>

      <h3 className="rp-card__title">{card.title}</h3>
      <p className="rp-card__desc">{card.description}</p>

      <div className="rp-card__footer">
        <button
          className={`rp-card__gen-btn ${isGenerating ? 'rp-card__gen-btn--busy' : ''}`}
          onClick={() => onGenerate(card)}
          disabled={isGenerating}
          aria-label={isGenerating ? `Generating ${card.title}` : `Generate ${card.title}`}
        >
          {isGenerating ? (
            <>
              <Loader size={14} className="rp-spin" aria-hidden="true" />
              <span>Generating…</span>
            </>
          ) : (
            <>
              <span>Generate Report</span>
              <ChevronRight size={15} aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </motion.article>
  );
}

function RecentReportRow({ report, onDownload }) {
  return (
    <motion.div
      className="rp-recent-item"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
    >
      <span className="rp-recent-item__icon" aria-hidden="true">
        <FileText size={18} />
      </span>

      <div className="rp-recent-item__info">
        <h4 className="rp-recent-item__title">{report.title}</h4>
        <p className="rp-recent-item__meta">
          <Clock size={11} aria-hidden="true" />
          {formatDate(report.created_at)}
          {report.date_range_start && (
            <>
              <span className="rp-recent-item__sep" aria-hidden="true">·</span>
              <Calendar size={11} aria-hidden="true" />
              {report.date_range_start} → {report.date_range_end}
            </>
          )}
        </p>
      </div>

      <span className={`rp-recent-item__badge rp-recent-item__badge--${report.format || 'pdf'}`}>
        {(report.format || 'PDF').toUpperCase()}
      </span>

      <button
        className="rp-recent-item__dl-btn"
        onClick={() => onDownload(report.report_id)}
        aria-label={`Download ${report.title}`}
        title="Download"
      >
        <Download size={15} />
      </button>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function ReportsPage() {
  const { authAxios } = useAuth();

  const [dateRange,       setDateRange]       = useState('month');
  const [reportType,      setReportType]      = useState('expense');
  const [loading,         setLoading]         = useState(false);
  const [generating,      setGenerating]      = useState(null);
  const [recentReports,   setRecentReports]   = useState([]);
  const [error,           setError]           = useState(null);
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });

  useEffect(() => { fetchRecentReports(); }, []);

  // ── API ────────────────────────────────────────────────────────────────────
  const fetchRecentReports = async () => {
    try {
      setLoading(true);
      const res = await authAxios.get('/reports/recent/');
      setRecentReports(res.data);
      setError(null);
    } catch {
      setError('Failed to fetch recent reports. Please try again.');
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
    } catch {
      setError('Failed to generate report. Please try again.');
    } finally {
      setGenerating(null);
    }
  };

  const handleDownloadReport = async (reportId) => {
    try {
      const res = await authAxios.get(`/reports/download/${reportId}/`, {
        responseType: 'blob',
      });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `report_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download report. Please try again.');
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const visibleCards = REPORT_CARDS.filter((c) =>
    reportType === 'expense' ? !c.type.includes('travel') : c.type.includes('travel')
  );

  // ── Initial loading screen ─────────────────────────────────────────────────
  if (loading && recentReports.length === 0) {
    return (
      <div className="rp-loading-screen" role="status" aria-label="Loading reports">
        <Loader size={38} className="rp-spin" />
        <p>Loading reports…</p>
      </div>
    );
  }

  return (
    <main className="rp-page">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <motion.div
        className="rp-page-header"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      >
        <div>
          <h1 className="rp-page-header__title">Reports &amp; Analytics</h1>
          <p className="rp-page-header__subtitle">Generate, filter and download expense reports</p>
        </div>
      </motion.div>

      {/* ── Error banner ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="rp-error"
            role="alert"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <AlertCircle size={18} aria-hidden="true" />
            <span>{error}</span>
            <button
              className="rp-error__close"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filters panel ───────────────────────────────────────────────── */}
      <motion.section
        className="rp-filters"
        aria-label="Report filters"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, type: 'spring', stiffness: 260, damping: 26 }}
      >
        {/* Date range */}
        <div className="rp-filters__group">
          <label className="rp-filters__label" id="date-range-label">Date Range</label>
          <div className="rp-filters__pills" role="group" aria-labelledby="date-range-label">
            {QUICK_RANGES.map((r) => (
              <button
                key={r.value}
                className={`rp-pill ${dateRange === r.value ? 'rp-pill--active' : ''}`}
                onClick={() => setDateRange(r.value)}
                aria-pressed={dateRange === r.value}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom date inputs */}
        <AnimatePresence>
          {dateRange === 'custom' && (
            <motion.div
              className="rp-custom-range"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <label className="rp-sr-only" htmlFor="custom-start">Start date</label>
              <input
                id="custom-start"
                type="date"
                className="rp-date-input"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange(p => ({ ...p, start: e.target.value }))}
              />
              <span className="rp-custom-range__sep" aria-hidden="true">→</span>
              <label className="rp-sr-only" htmlFor="custom-end">End date</label>
              <input
                id="custom-end"
                type="date"
                className="rp-date-input"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange(p => ({ ...p, end: e.target.value }))}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report type */}
        <div className="rp-filters__group">
          <label className="rp-filters__label" id="report-type-label">Report Type</label>
          <div className="rp-filters__pills" role="group" aria-labelledby="report-type-label">
            {REPORT_TYPES.map((t) => (
              <button
                key={t.value}
                className={`rp-pill ${reportType === t.value ? 'rp-pill--active' : ''}`}
                onClick={() => setReportType(t.value)}
                aria-pressed={reportType === t.value}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Apply */}
        <button
          className="rp-apply-btn"
          onClick={fetchRecentReports}
          disabled={loading}
          aria-label="Apply filters and refresh reports"
        >
          {loading
            ? <Loader size={15} className="rp-spin" aria-hidden="true" />
            : <Filter size={15} aria-hidden="true" />}
          Apply Filters
        </button>
      </motion.section>

      {/* ── Report cards grid ────────────────────────────────────────────── */}
      <section aria-label="Available report types">
        <div className="rp-cards-grid">
          {visibleCards.map((card, idx) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, type: 'spring', stiffness: 280, damping: 24 }}
            >
              <ReportCard
                card={card}
                isGenerating={generating === card.id}
                onGenerate={handleGenerateReport}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Recent reports ───────────────────────────────────────────────── */}
      <motion.section
        className="rp-recent"
        aria-label="Recently generated reports"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 26 }}
      >
        <div className="rp-recent__header">
          <h2 className="rp-recent__title">Recently Generated</h2>
          <button
            className="rp-recent__refresh"
            onClick={fetchRecentReports}
            disabled={loading}
            aria-label="Refresh recent reports"
          >
            <RefreshCw size={14} className={loading ? 'rp-spin' : ''} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {recentReports.length > 0 ? (
          <div className="rp-recent__list">
            {recentReports.map((report) => (
              <RecentReportRow
                key={report.id}
                report={report}
                onDownload={handleDownloadReport}
              />
            ))}
          </div>
        ) : (
          <div className="rp-recent__empty" role="status">
            <FileText size={36} aria-hidden="true" />
            <p>No reports generated yet</p>
            <span>Generate a report above to see it here</span>
          </div>
        )}
      </motion.section>

    </main>
  );
}

export default ReportsPage;