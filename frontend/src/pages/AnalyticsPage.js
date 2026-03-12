// frontend/src/pages/AnalyticsPage.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign,
  Users, Plane, CheckCircle, Calendar, Download,
  RefreshCw, AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';


const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#64748b'];

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, change, color, prefix = '' }) {
  const isPositive = change >= 0;
  return (
    <motion.div
      className="an-stat-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      style={{ borderTop: `3px solid ${color}` }}
    >
      <div className="an-stat-icon" style={{ background: `${color}18`, color }}>
        <Icon size={20} />
      </div>
      <div className="an-stat-body">
        <span className="an-stat-label">{label}</span>
        <span className="an-stat-value">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {change !== undefined && (
          <span className={`an-stat-change ${isPositive ? 'pos' : 'neg'}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(change)}% vs last month
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="an-tooltip">
      <p className="an-tooltip__label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="an-tooltip__item" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? `€${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
function AnalyticsPage() {
  const { authAxios } = useAuth();

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [range, setRange]     = useState('6m');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await authAxios.get(`/analytics/?range=${range}`);
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, [range]);

  const RANGES = [
    { key: '1m', label: '1M' },
    { key: '3m', label: '3M' },
    { key: '6m', label: '6M' },
    { key: '1y', label: '1Y' },
  ];

  if (loading) return (
    <div className="an-fullpage-center">
      <RefreshCw size={28} className="an-spin" />
      <span>Loading analytics…</span>
    </div>
  );

  if (error || !data) return (
    <div className="an-fullpage-center">
      <AlertCircle size={32} />
      <span>{error || 'No data'}</span>
      <button className="an-retry-btn" onClick={fetchAnalytics}>Retry</button>
    </div>
  );

  return (
    <div className="an-page">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="an-header">
        <div>
          <h1 className="an-title">Analytics</h1>
          <p className="an-sub">Overview of expense trends and spending patterns</p>
        </div>
        <div className="an-header-right">
          <div className="an-range-group">
            {RANGES.map(r => (
              <button
                key={r.key}
                className={`an-range-btn ${range === r.key ? 'active' : ''}`}
                onClick={() => setRange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button className="an-export-btn" onClick={fetchAnalytics}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="an-export-btn">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────── */}
      <div className="an-stats-grid">
        <StatCard icon={DollarSign}  label="Total Expenses"   value={data.summary.total_amount}     change={data.summary.amount_change}   color="#3b82f6" prefix="€" />
        <StatCard icon={BarChart3}   label="Total Claims"     value={data.summary.total_count}      change={data.summary.count_change}    color="#10b981" />
        <StatCard icon={CheckCircle} label="Approved"         value={data.summary.approved_count}   change={data.summary.approval_change} color="#f59e0b" />
        <StatCard icon={Plane}       label="Active Trips"     value={data.summary.active_trips}                                           color="#8b5cf6" />
        <StatCard icon={Users}       label="Active Employees" value={data.summary.active_employees}                                       color="#ec4899" />
        <StatCard icon={Calendar}    label="Avg per Employee" value={data.summary.avg_per_employee} change={data.summary.avg_change}      color="#14b8a6" prefix="€" />
      </div>

      {/* ── Charts row 1 ────────────────────────────────── */}
      <div className="an-charts-grid">

        {/* Monthly trend */}
        <div className="an-chart-card col-8">
          <div className="an-chart-title">Monthly Expense Trend</div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.monthly_trend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="gradApproved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #f3f4f6)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="total"    name="Total"    stroke="#3b82f6" strokeWidth={2} fill="url(#gradTotal)"    />
              <Area type="monotone" dataKey="approved" name="Approved" stroke="#10b981" strokeWidth={2} fill="url(#gradApproved)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className="an-chart-card col-4">
          <div className="an-chart-title">By Category</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.by_category}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={90}
                paddingAngle={3}
                dataKey="amount"
                nameKey="name"
              >
                {data.by_category.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `€${Number(v).toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Charts row 2 ────────────────────────────────── */}
      <div className="an-charts-grid">

        {/* Department bar */}
        <div className="an-chart-card col-6">
          <div className="an-chart-title">Department Spending</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.by_department} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #f3f4f6)" />
              <XAxis dataKey="department" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" name="Amount" radius={[5, 5, 0, 0]}>
                {data.by_department.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status breakdown */}
        <div className="an-chart-card col-6">
          <div className="an-chart-title">Status Breakdown</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.by_status} layout="vertical" margin={{ top: 5, right: 10, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #f3f4f6)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="status" type="category" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Count" radius={[0, 5, 5, 0]}>
                {data.by_status.map((s, i) => {
                  const c =
                    s.status === 'approved' ? '#10b981' :
                    s.status === 'rejected' ? '#ef4444' : '#f59e0b';
                  return <Cell key={i} fill={c} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bottom row ───────────────────────────────────── */}
      <div className="an-charts-grid">

        {/* Top spenders */}
        <div className="an-chart-card col-6">
          <div className="an-chart-title">Top Spenders</div>
          <table className="an-top-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.top_spenders.map((emp, i) => (
                <tr key={i}>
                  <td className="an-rank-cell">{i + 1}</td>
                  <td>{emp.name}</td>
                  <td className="an-dept-cell">{emp.department}</td>
                  <td className="an-amount-cell">€{Number(emp.amount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Category breakdown */}
        <div className="an-chart-card col-6">
          <div className="an-chart-title">Category Breakdown</div>
          <div className="an-category-list">
            {data.by_category.map((cat, i) => {
              const max = Math.max(...data.by_category.map(c => c.amount));
              const pct = Math.round((cat.amount / max) * 100);
              return (
                <div key={i} className="an-category-item">
                  <div className="an-category-row">
                    <span className="an-category-name">{cat.name}</span>
                    <span className="an-category-amount" style={{ color: COLORS[i % COLORS.length] }}>
                      €{Number(cat.amount).toLocaleString()}
                    </span>
                  </div>
                  <div className="an-prog-bar">
                    <motion.div
                      className="an-prog-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, delay: i * 0.05 }}
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;