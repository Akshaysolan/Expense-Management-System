import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, FileText, PieChart,
  BarChart3, TrendingUp, Filter,
  ChevronRight, Loader, AlertCircle,
  RefreshCw, Calendar, Clock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function ReportCard({ card, isGenerating, onGenerate }) {
  const Icon = card.icon;

  return (
    <motion.article
      className={`rp-card rp-card--${card.colorKey}`}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
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
        >
          {isGenerating ? (
            <>
              <Loader size={14} className="rp-spin" />
              <span>Generating…</span>
            </>
          ) : (
            <>
              <span>Generate Report</span>
              <ChevronRight size={15} />
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
        title="Download"
      >
        <Download size={15} />
      </button>
    </motion.div>
  );
}

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
      await authAxios.post('/reports/generate/', {
        report_type:      card.type,
        date_range_start: customDateRange.start,
        date_range_end:   customDateRange.end,
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

  const visibleCards = REPORT_CARDS.filter((c) =>
    reportType === 'expense' ? !c.type.includes('travel') : c.type.includes('travel')
  );

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
      <motion.div
        className="rp-page-header"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      >
        <div>
          <h1 className="rp-page-header__title">Reports & Analytics</h1>
          <p className="rp-page-header__subtitle">Generate, filter and download expense reports</p>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            className="rp-error"
            role="alert"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
            <button className="rp-error__close" onClick={() => setError(null)}>×</button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.section
        className="rp-filters"
        aria-label="Report filters"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <div className="rp-filters__group">
          <label className="rp-filters__label">Report Type</label>
          <div className="rp-filters__pills">
            <button
              className={`rp-pill ${reportType === 'expense' ? 'rp-pill--active' : ''}`}
              onClick={() => setReportType('expense')}
            >
              Expense Reports
            </button>
            <button
              className={`rp-pill ${reportType === 'trip' ? 'rp-pill--active' : ''}`}
              onClick={() => setReportType('trip')}
            >
              Trip Reports
            </button>
          </div>
        </div>

        <button className="rp-apply-btn" onClick={fetchRecentReports} disabled={loading}>
          {loading ? <Loader size={15} className="rp-spin" /> : <RefreshCw size={15} />}
          Refresh
        </button>
      </motion.section>

      <section aria-label="Available report types">
        <div className="rp-cards-grid">
          {visibleCards.map((card, idx) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
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

      <motion.section
        className="rp-recent"
        aria-label="Recently generated reports"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="rp-recent__header">
          <h2 className="rp-recent__title">Recently Generated</h2>
          <button className="rp-recent__refresh" onClick={fetchRecentReports} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'rp-spin' : ''} />
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
            <FileText size={36} />
            <p>No reports generated yet</p>
            <span>Generate a report above to see it here</span>
          </div>
        )}
      </motion.section>
    </main>
  );
}

export default ReportsPage;